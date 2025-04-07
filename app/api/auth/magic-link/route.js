import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Ensure required env vars are present
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Server config error: missing JWT_SECRET' },
        { status: 500 }
      );
    }
    if (!process.env.APP_URL) {
      return NextResponse.json(
        { success: false, message: 'Server config error: missing APP_URL' },
        { status: 500 }
      );
    }

    // 1) Parse query param
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token in query' },
        { status: 400 }
      );
    }

    // 2) Look up in DB
    let record;
    try {
      record = await prisma.magicLink.findUnique({ where: { token } });
    } catch (dbErr) {
      console.error('Database error while finding token:', dbErr);
      return NextResponse.json(
        { success: false, message: 'DB error on magicLink lookup' },
        { status: 500 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 400 }
      );
    }

    if (record.used) {
      return NextResponse.json(
        { success: false, message: 'Token already used' },
        { status: 400 }
      );
    }

    // Check expiry
    const now = new Date();
    if (record.expiresAt < now) {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }

    // 3) Mark token as used
    try {
      await prisma.magicLink.update({
        where: { token },
        data: { used: true },
      });
    } catch (dbErr) {
      console.error('Database error while updating token as used:', dbErr);
      return NextResponse.json(
        { success: false, message: 'DB error on token update' },
        { status: 500 }
      );
    }

    // 4) Create a JWT with user’s email
    const userEmail = record.email;

    let jwt;
    try {
      jwt = sign({ email: userEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });
    } catch (jwtErr) {
      console.error('JWT signing error:', jwtErr);
      return NextResponse.json(
        { success: false, message: 'Error creating auth token' },
        { status: 500 }
      );
    }

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
    return NextResponse.json({ success: false, message: `Unexpected error: ${err.message}` }, { status: 500 });
  }
}