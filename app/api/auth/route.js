import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import jsforce from 'jsforce';

import { prisma } from '@/lib/prisma';
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
    // Ensure essential environment variables
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing email environment vars (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)',
        },
        { status: 500 }
      );
    }
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Missing JWT_SECRET env var' },
        { status: 500 }
      );
    }
    if (!process.env.APP_URL) {
      return NextResponse.json(
        { success: false, message: 'Missing APP_URL env var' },
        { status: 500 }
      );
    }

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
      let accessToken, refreshToken, instanceUrl;
      try {
        const tokens = await getSystemTokensFromRedis();
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        instanceUrl = tokens.instanceUrl;
      } catch (rErr) {
        console.error('Error reading Redis for system tokens:', rErr);
        return NextResponse.json(
          { success: false, message: 'Error reading system tokens' },
          { status: 500 }
        );
      }

      if (!accessToken || !refreshToken || !instanceUrl) {
        return NextResponse.json(
          { success: false, message: 'System user tokens are not set yet' },
          { status: 500 }
        );
      }

      // 1B) Connect to Salesforce w/ existing OAuth tokens
      let conn;
      try {
        conn = new jsforce.Connection({
          oauth2: getOAuth2(),
          accessToken,
          refreshToken,
          instanceUrl,
        });
      } catch (sfConnErr) {
        console.error('SF Connection init error:', sfConnErr);
        return NextResponse.json(
          { success: false, message: 'Salesforce connection init error' },
          { status: 500 }
        );
      }

      // 1C) Check if PersonEmail exists
      const querySF = `
        SELECT Id, Name, PersonEmail
        FROM Account
        WHERE PersonEmail = '${email}'
        LIMIT 1
      `;
      let result;
      try {
        result = await conn.query(querySF);
      } catch (sfQueryErr) {
        console.error('Salesforce query error:', sfQueryErr);
        return NextResponse.json(
          { success: false, message: 'Error querying Salesforce' },
          { status: 500 }
        );
      }

      if (result.totalSize === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `No Salesforce account found for email: ${email}`,
          },
          { status: 404 }
        );
      }

      // 1D) Generate & store OTP in Postgres
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTimestamp = new Date(Date.now() + 5 * 60_000); // 5 minutes

      try {
        await prisma.otpRecord.create({
          data: {
            email,
            otp: code,
            expiry: expiryTimestamp,
            used: false,
          },
        });
      } catch (dbErr) {
        console.error('DB error creating OTP record:', dbErr);
        return NextResponse.json(
          { success: false, message: 'Failed to create OTP record' },
          { status: 500 }
        );
      }

      // 1E) Send OTP via email
      let transporter;
      try {
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      } catch (mailErr) {
        console.error('Nodemailer transporter init error:', mailErr);
        return NextResponse.json(
          { success: false, message: 'Email transporter init error' },
          { status: 500 }
        );
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your OTP Code',
          text: `Your login code is ${code}. It expires in 5 minutes.`,
        });
      } catch (sendMailErr) {
        console.error('Error sending OTP email:', sendMailErr);
        return NextResponse.json(
          { success: false, message: 'Failed to send OTP email' },
          { status: 500 }
        );
      }

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
      let record;
      try {
        record = await prisma.otpRecord.findFirst({
          where: { email, otp, used: false },
        });
      } catch (dbErr) {
        console.error('DB error finding OTP record:', dbErr);
        return NextResponse.json(
          { success: false, message: 'Failed to query OTP record' },
          { status: 500 }
        );
      }

      if (!record) {
        return NextResponse.json(
          { success: false, message: 'No OTP found for this email' },
          { status: 400 }
        );
      }

      // 2B) Check expiry
      if (new Date() > record.expiry) {
        try {
          await prisma.otpRecord.update({
            where: { id: record.id },
            data: { used: true },
          });
        } catch (dbErr) {
          console.error('DB error marking expired OTP as used:', dbErr);
        }
        return NextResponse.json(
          { success: false, message: 'OTP expired' },
          { status: 401 }
        );
      }

      // 2C) Mark OTP as used if valid
      try {
        await prisma.otpRecord.update({
          where: { id: record.id },
          data: { used: true },
        });
      } catch (dbErr) {
        console.error('DB error marking OTP as used:', dbErr);
        return NextResponse.json(
          { success: false, message: 'Failed to mark OTP as used' },
          { status: 500 }
        );
      }

      // 2D) Create JWT & set cookie
      let token;
      try {
        token = sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      } catch (jwtErr) {
        console.error('JWT sign error:', jwtErr);
        return NextResponse.json(
          { success: false, message: 'Failed to create auth token' },
          { status: 500 }
        );
      }

      const response = NextResponse.json({ success: true, message: 'OTP verified' });
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

      // 3A) Get system tokens from Redis
      let accessToken, refreshToken, instanceUrl;
      try {
        const tokens = await getSystemTokensFromRedis();
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        instanceUrl = tokens.instanceUrl;
      } catch (rErr) {
        console.error('Error reading Redis for system tokens:', rErr);
        return NextResponse.json(
          { success: false, message: 'Error reading system tokens' },
          { status: 500 }
        );
      }

      if (!accessToken || !refreshToken || !instanceUrl) {
        return NextResponse.json(
          { success: false, message: 'System user tokens are not set yet' },
          { status: 500 }
        );
      }

      // 3B) Connect to Salesforce
      let conn;
      try {
        conn = new jsforce.Connection({
          oauth2: getOAuth2(),
          accessToken,
          refreshToken,
          instanceUrl,
        });
      } catch (sfConnErr) {
        console.error('SF Connection init error:', sfConnErr);
        return NextResponse.json(
          { success: false, message: 'Salesforce connection init error' },
          { status: 500 }
        );
      }

      // 3C) Check if PersonEmail exists in SF
      const querySF = `
        SELECT Id, Name, PersonEmail
        FROM Account
        WHERE PersonEmail = '${email}'
        LIMIT 1
      `;
      let result;
      try {
        result = await conn.query(querySF);
      } catch (sfQueryErr) {
        console.error('Salesforce query error:', sfQueryErr);
        return NextResponse.json(
          { success: false, message: 'Error querying Salesforce' },
          { status: 500 }
        );
      }

      if (result.totalSize === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `No Salesforce account found for email: ${email}`,
          },
          { status: 404 }
        );
      }

      // 3D) Generate magic link token & expiry
      let magicToken;
      try {
        const tokenBytes = randomBytes(20);
        magicToken = tokenBytes.toString('hex');
      } catch (randErr) {
        console.error('Error generating random bytes for magic token:', randErr);
        return NextResponse.json(
          { success: false, message: 'Failed to generate magic token' },
          { status: 500 }
        );
      }

      const expiresAt = new Date(Date.now() + 5 * 60_000); // e.g. 5 min

      // 3E) Store in DB
      try {
        await prisma.magicLink.create({
          data: {
            token: magicToken,
            email,
            expiresAt,
            used: false,
          },
        });
      } catch (dbErr) {
        console.error('DB error creating magicLink:', dbErr);
        return NextResponse.json(
          { success: false, message: 'Failed to store magic link' },
          { status: 500 }
        );
      }

      // 3F) Build the magic link URL
      const magicLinkUrl = `${process.env.APP_URL}/api/auth/magic-link?token=${magicToken}`;

      // 3G) Send the magic link via email
      let transporter;
      try {
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
      } catch (mailErr) {
        console.error('Nodemailer transporter init error:', mailErr);
        return NextResponse.json(
          { success: false, message: 'Email transporter init error' },
          { status: 500 }
        );
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Magic Link',
          text: `Click this link to log in:\n\n${magicLinkUrl}\n\nExpires in 5 minutes.`,
        });
      } catch (sendMailErr) {
        console.error('Error sending magic link email:', sendMailErr);
        return NextResponse.json(
          { success: false, message: 'Failed to send magic link email' },
          { status: 500 }
        );
      }

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