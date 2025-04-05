import { NextResponse } from 'next/server';
import jsforce from 'jsforce';
import { getOAuth2, storeTokens } from '@/lib/salesforce';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided.' }, { status: 400 });
    }

    const conn = new jsforce.Connection({ oauth2: getOAuth2() });
    await conn.authorize(code);

    // Verify that tokens have been received
    if (!conn.accessToken || !conn.refreshToken || !conn.instanceUrl) {
      return NextResponse.json({ error: 'Authorization failed: Tokens not received.' }, { status: 500 });
    }

    // Store the tokens
    storeTokens({
      accessToken: conn.accessToken,
      refreshToken: conn.refreshToken,
      instanceUrl: conn.instanceUrl
    });

    // Redirect the user to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}