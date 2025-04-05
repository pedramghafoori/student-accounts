import { NextResponse } from 'next/server';
import { getOAuth2 } from '@/lib/salesforce'; // or wherever your OAuth logic is

export async function GET() {
  // 1) Get the OAuth2 instance which knows your client ID, secret, etc.
  const oauth2 = getOAuth2();

  // 2) Build the Salesforce authorization URL
  //    Typically you specify the scope; for example: 'full refresh_token'
  const authUrl = oauth2.getAuthorizationUrl({
    scope: 'full refresh_token', 
    // or 'api refresh_token', or any needed scopes
  });

  // 3) Redirect the user to Salesforce's login page
  return NextResponse.redirect(authUrl);
}
