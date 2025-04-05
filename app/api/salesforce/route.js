// app/api/salesforce/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import jsforce from 'jsforce';

// Example: Suppose you import a helper that returns your stored tokens.
// Adjust this import path and variable names as needed.
import { getOAuth2, getStoredTokens } from '@/lib/salesforce';

export async function GET() {
  try {
    // 1) Retrieve the JWT from our cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('userToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No user token found' },
        { status: 401 }
      );
    }

    // 2) Decode/verify the token to get email
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userEmail = decoded.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'No email in token' },
        { status: 400 }
      );
    }

    // 3) Get your stored Salesforce tokens (accessToken, refreshToken, instanceUrl)
    //    Example: maybe you saved them in memory or a database after the OAuth callback.
    const { accessToken, refreshToken, instanceUrl } = getStoredTokens();
    // If this returns null/undefined for any tokens, you need to handle that (e.g., 401 error).

    // 4) Connect to Salesforce with existing OAuth tokens
    //    You do NOT call conn.login() here.
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),     // If you need the same OAuth2 config for refresh logic
      accessToken,             // The stored access token
      refreshToken,            // The stored refresh token (optional but recommended)
      instanceUrl              // The user’s instance URL from the OAuth callback
    });

    // If jsforce detects an expired access token, it will attempt to use refreshToken
    // automatically if you have provided an oauth2 object and refreshToken.

    // 5) Query Salesforce. Using PersonEmail on the Account object (Person Account)
    const query = `
      SELECT Id, Name, PersonEmail
      FROM Account
      WHERE PersonEmail = '${userEmail}'
    `;
    const result = await conn.query(query);

    if (result.totalSize === 0) {
      return NextResponse.json(
        { success: false, message: 'No matching account found' },
        { status: 404 }
      );
    }

    // 6) Return the first matching record
    return NextResponse.json({
      success: true,
      account: result.records[0],
    });
  } catch (error) {
    console.error('Salesforce Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}