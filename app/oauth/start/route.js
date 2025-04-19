import { NextResponse } from 'next/server';
import { getOAuth2 } from '@/lib/salesforce'; // or wherever your OAuth logic is

export async function GET(request) {
  // 1) Get the OAuth2 instance which knows your client ID, secret, etc.
  const oauth2 = getOAuth2();

  // 2) Build the callback URL using the current request's URL
  const requestUrl = new URL(request.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  const callbackUrl = `${baseUrl}${process.env.SF_OAUTH_CALLBACK}`;

  // 3) Build the Salesforce authorization URL
  const authUrl = oauth2.getAuthorizationUrl({
    scope: 'full refresh_token',
    redirect_uri: callbackUrl
  });

  // 4) Redirect the user to Salesforce's login page
  return NextResponse.redirect(authUrl);
}
