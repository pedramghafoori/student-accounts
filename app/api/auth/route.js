// app/api/auth/route.js

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'crypto';    // For magic link token generation
import jsforce from 'jsforce';

import { prisma } from '@/lib/prisma';   // Prisma client
import redisClient from '@/lib/redisClient';
import { getOAuth2 } from '@/lib/salesforce';

// Retrieve system user tokens from Redis for your SF check
export async function getSystemTokensFromRedis() {
  const tokenString = await redisClient.get('salesforce_tokens');
  if (!tokenString) {
    return { accessToken: null, refreshToken: null, instanceUrl: null };
  }
  return JSON.parse(tokenString);
}

export async function POST(request) {
  try {
    const { action, email, otp } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'No action provided' },
        { status: 400 }
      );
    }

    // ----------------------
    // 1) SEND OTP
    // ----------------------
    if (action === 'send-otp') {
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required' },
          { status: 400 }
        );
      }

      // 1A) Get system tokens from Redis
      const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
      if (!accessToken || !refreshToken || !instanceUrl) {
        return NextResponse.json(
          { success: false, message: 'System user tokens are not set yet' },
          { status: 500 }
        );
      }

      // 1B) Connect to Salesforce w/ existing OAuth tokens
      const conn = new jsforce.Connection({
        oauth2: getOAuth2(),
        accessToken,
        refreshToken,
        instanceUrl,
      });

      // 1C) Check if PersonEmail exists
      const querySF = `
        SELECT Id, Name, PersonEmail
        FROM Account
        WHERE PersonEmail = '${email}'
        LIMIT 1
      `;
      const result = await conn.query(querySF);

      if (result.totalSize === 0) {
        return NextResponse.json(
          { success: false, message: `No Salesforce account found for email: ${email}` },
          { status: 404 }
        );
      }

      // 1D) Generate & store OTP in Postgres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTimestamp = new Date(Date.now() + 5 * 60_000); // 5 minutes

      await prisma.otpRecord.create({
        data: {
          email,
          otp: code,
          expiry: expiryTimestamp,
          used: false,
        },
      });

      // 1E) Send OTP via email
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your login code is ${code}. It expires in 5 minutes.`,
      });

      return NextResponse.json({ success: true, message: 'OTP sent' });
    }

    // ----------------------
    // 2) VERIFY OTP
    // ----------------------
    if (action === 'verify-otp') {
      if (!email || !otp) {
        return NextResponse.json(
          { success: false, message: 'Email and OTP required' },
          { status: 400 }
        );
      }

      // 2A) Find OTP record in Postgres
      const record = await prisma.otpRecord.findFirst({
        where: { email, otp, used: false },
      });
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'No OTP found for this email' },
          { status: 400 }
        );
      }

      // 2B) Check expiry
      if (new Date() > record.expiry) {
        // Mark as used if expired
        await prisma.otpRecord.update({
          where: { id: record.id },
          data: { used: true },
        });
        return NextResponse.json(
          { success: false, message: 'OTP expired' },
          { status: 401 }
        );
      }

      // 2C) Mark OTP as used if valid
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { used: true },
      });

      // 2D) Create JWT & set cookie
      const token = sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const response = NextResponse.json({
        success: true,
        message: 'OTP verified',
      });
      response.cookies.set({
        name: 'userToken',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60,
        secure: process.env.NODE_ENV === 'production',
      });

      return response;
    }

    // ----------------------
    // 3) SEND MAGIC LINK
    // ----------------------
    if (action === 'send-magic-link') {
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required' },
          { status: 400 }
        );
      }

      // 3A) Get system tokens from Redis for the Salesforce check
      const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
      if (!accessToken || !refreshToken || !instanceUrl) {
        return NextResponse.json(
          { success: false, message: 'System user tokens are not set yet' },
          { status: 500 }
        );
      }

      // 3B) Connect to Salesforce (similar to send-otp)
      const conn = new jsforce.Connection({
        oauth2: getOAuth2(),
        accessToken,
        refreshToken,
        instanceUrl,
      });

      // 3C) Check if PersonEmail exists in SF
      const querySF = `
        SELECT Id, Name, PersonEmail
        FROM Account
        WHERE PersonEmail = '${email}'
        LIMIT 1
      `;
      const result = await conn.query(querySF);
      if (result.totalSize === 0) {
        return NextResponse.json(
          { success: false, message: `No Salesforce account found for email: ${email}` },
          { status: 404 }
        );
      }

      // 3D) Generate magic link token & expiry
      const tokenBytes = randomBytes(20);
      const magicToken = tokenBytes.toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60_000); // e.g. 5 min

      // 3E) Store in DB (assuming you have a MagicLink model)
      await prisma.magicLink.create({
        data: {
          token: magicToken,
          email,
          expiresAt,
          used: false,
        },
      });

      // 3F) Build the magic link URL (process.env.APP_URL must be set, e.g. http://localhost:3000)
      const magicLinkUrl = `${process.env.APP_URL}/api/auth/magic-link?token=${magicToken}`;

      // 3G) Send the magic link via email
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Magic Link',
        text: `Click this link to log in:\n\n${magicLinkUrl}\n\nExpires in 5 minutes.`,
      });

      return NextResponse.json({ success: true, message: 'Magic link sent' });
    }

    // ----------------------
    // Unknown action
    // ----------------------
    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in /api/auth route:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}