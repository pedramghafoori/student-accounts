import { NextResponse } from 'next/server';
import jsforce from 'jsforce';
import { getOAuth2 } from '@/lib/salesforce';
import redisClient from '@/lib/redisClient';

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

    // Store the tokens in Redis
    await redisClient.set(
      'salesforce_tokens',
      JSON.stringify({
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        instanceUrl: conn.instanceUrl
      })
    );
    console.log('Salesforce tokens stored in Redis:', {
      accessToken: conn.accessToken,
      refreshToken: conn.refreshToken,
      instanceUrl: conn.instanceUrl
    });

    // Redirect the user to the courses page
    return NextResponse.redirect(new URL('/courses', request.url));
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}