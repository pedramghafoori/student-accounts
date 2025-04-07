// app/api/auth/magic-link/route.js

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // 1) Parse query param
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token in query' }, { status: 400 });
    }

    // 2) Look up in DB
    const record = await prisma.magicLink.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ success: false, message: 'Token already used' }, { status: 400 });
    }

    // Check expiry
    const now = new Date();
    if (record.expiresAt < now) {
      return NextResponse.json({ success: false, message: 'Token expired' }, { status: 401 });
    }

    // 3) Mark token as used (so it can’t be reused)
    await prisma.magicLink.update({
      where: { token },
      data: { used: true },
    });

    // 4) Create a JWT with user’s email 
    // (assuming we just store the email in token)
    const userEmail = record.email;
    const jwt = sign({ email: userEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 5) Set the cookie, redirect to dashboard
    const response = NextResponse.redirect(`${process.env.APP_URL}/dashboard`);

    response.cookies.set({
      name: 'userToken',
      value: jwt,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60, // 1 hour
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    console.error('Magic link error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}