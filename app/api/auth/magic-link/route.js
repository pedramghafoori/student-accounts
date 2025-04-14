import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sign } from 'jsonwebtoken';

// GET = Step 1: Show "Confirm Login" page (do not mark token as used).
export async function GET(request) {
  try {
    // 1) Parse token from query string
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token in query' },
        { status: 400 }
      );
    }

    // 2) Look up the magic link in DB (but do NOT mark used)
    const record = await prisma.magicLink.findUnique({ where: { token } });
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
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }

    // 3) Redirect to the new "confirm" page instead of returning HTML
    return NextResponse.redirect(`${process.env.APP_URL}/login/confirm?token=${token}`);
  } catch (err) {
    console.error('Magic link GET error:', err);
    return NextResponse.json(
      { success: false, message: `Unexpected error: ${err.message}` },
      { status: 500 }
    );
  }
}

// POST = Step 2: Mark token used, create JWT, set cookie, redirect to /dashboard
export async function POST(request) {
  try {
    // 1) Parse form data. This is a standard Form submission.
    const formData = await request.formData();
    const token = formData.get('token');
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token in form data' },
        { status: 400 }
      );
    }

    // 2) Find the record again
    const record = await prisma.magicLink.findUnique({ where: { token } });
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
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Token expired' },
        { status: 401 }
      );
    }

    // 3) Mark token as used
    await prisma.magicLink.update({
      where: { token },
      data: { used: true },
    });

    // 4) Create JWT & set cookie
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

    // 5) Redirect user to /dashboard, setting userToken cookie
    const response = NextResponse.redirect(`${process.env.APP_URL}/dashboard`, { status: 302 });
    response.cookies.set('userToken', jwt, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60, // 1 hour
      secure: true, // Always secure in production
      sameSite: 'none' // Allow cross-site requests
    });

    return response;
  } catch (err) {
    console.error('Magic link POST error:', err);
    return NextResponse.json(
      { success: false, message: `Unexpected error: ${err.message}` },
      { status: 500 }
    );
  }
}