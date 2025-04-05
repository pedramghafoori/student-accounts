// app/api/auth/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import jsforce from 'jsforce';
import { prisma } from '@/lib/prisma';

import { getSystemTokens, getOAuth2 } from '@/lib/salesforce';

export async function POST(request) {
  try {
    const { action, email, otp } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'No action provided' },
        { status: 400 }
      );
    }

    // 1) SEND OTP
    if (action === 'send-otp') {
      if (!email) {
        return NextResponse.json(
          { success: false, message: 'Email is required' },
          { status: 400 }
        );
      }

      // --- Check if this email is on any Salesforce Account using OAuth tokens ---
      // Retrieve the previously-stored system user tokens
      const { accessToken, refreshToken, instanceUrl } = getSystemTokens();
      if (!accessToken || !refreshToken || !instanceUrl) {
        // If we have no tokens, we can’t query Salesforce
        return NextResponse.json(
          { success: false, message: 'System user tokens are not set yet' },
          { status: 500 }
        );
      }

      // Create a jsforce connection that will attempt a refresh if the accessToken is expired
      const conn = new jsforce.Connection({
        oauth2: getOAuth2(),
        accessToken,
        refreshToken,
        instanceUrl,
      });

      // Query for PersonEmail
      const query = `
        SELECT Id, Name, PersonEmail
        FROM Account
        WHERE PersonEmail = '${email}'
        LIMIT 1
      `;
      const result = await conn.query(query);

      if (result.totalSize === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `No Salesforce account found for email: ${email}`,
          },
          { status: 404 }
        );
      }

      // Proceed with generating & sending the OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
      const expiryTimestamp = new Date(Date.now() + 5 * 60_000); // 5 minutes from now

      // Persist OTP in Postgres
      await prisma.otpRecord.create({
        data: {
          email,
          otp: code,
          expiry: expiryTimestamp,
          used: false,
        },
      });

      // Configure nodemailer using your environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Send the OTP email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your login code is ${code}. It expires in 5 minutes.`,
      });

      return NextResponse.json({ success: true, message: 'OTP sent' });
    }

    // 2) VERIFY OTP
    if (action === 'verify-otp') {
      if (!email || !otp) {
        return NextResponse.json(
          { success: false, message: 'Email and OTP required' },
          { status: 400 }
        );
      }

      // Retrieve the OTP record from Postgres
      const record = await prisma.otpRecord.findFirst({
        where: { email, otp, used: false },
      });
      if (!record) {
        return NextResponse.json(
          { success: false, message: 'No OTP found for this email' },
          { status: 400 }
        );
      }

      // Check if OTP expired
      if (new Date() > record.expiry) {
        // Mark the OTP as used to prevent reuse
        await prisma.otpRecord.update({
          where: { id: record.id },
          data: { used: true },
        });
        return NextResponse.json(
          { success: false, message: 'OTP expired' },
          { status: 401 }
        );
      }
      // OTP is valid—mark it as used
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { used: true },
      });

      // Create a JWT containing the user's email
      const token = sign({ email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      // Create a response that sets the JWT in an HTTP-only cookie
      const response = NextResponse.json({
        success: true,
        message: 'OTP verified',
      });

      response.cookies.set({
        name: 'userToken',
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60, // 1 hour
        secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
      });

      return response;
    }

    // Unknown action
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