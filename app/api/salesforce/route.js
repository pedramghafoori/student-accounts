import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import jsforce from 'jsforce';

// Example: Suppose you import a helper that returns your stored tokens.
import { getOAuth2 } from '@/lib/salesforce';
import redisClient from '@/lib/redisClient';

async function getSystemTokensFromRedis() {
    const tokenString = await redisClient.get('salesforce_tokens');
    if (!tokenString) return { accessToken: null, refreshToken: null, instanceUrl: null };
    return JSON.parse(tokenString);
}

export async function GET(request) {
  try {
    // 0) If it's a HEAD request, do NOT consume the token
    if (request.method === 'HEAD') {
      console.log('HEAD request detected, not marking token as used');
      return NextResponse.json({ success: true, message: 'HEAD request, token NOT used' });
    }

    console.log("Starting GET /api/salesforce route");
    // 1) Retrieve the JWT from our cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('userToken')?.value;
    console.log("JWT token from cookie:", token);
    if (!token) {
      console.error("No user token found in cookies");
      // Redirect the user to login with a reason parameter indicating token expiration
      return NextResponse.redirect(new URL('/login?reason=expired', request.url));
    }

    // 2) Decode/verify the token to get email
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);
    } catch (err) {
      console.error("Token verification failed:", err);
      // If token verification fails (likely because of expiration), redirect to login.
      return NextResponse.redirect(new URL('/login?reason=expired', request.url));
    }

    const userEmail = decoded.email;
    console.log("User email from decoded token:", userEmail);
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'No email in token' },
        { status: 400 }
      );
    }

    // 3) Get your stored Salesforce tokens from Redis
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    console.log("Retrieved Salesforce tokens from Redis:", { accessToken, refreshToken, instanceUrl });
     
    // If tokens are missing, handle appropriately.
    if (!accessToken || !refreshToken || !instanceUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing Salesforce tokens' },
        { status: 500 }
      );
    }

    // 4) Connect to Salesforce with existing OAuth tokens
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl
    });
    console.log("Created Salesforce connection with tokens");

    // 5) Query Salesforce for the Account record using PersonEmail on the Account object (Person Account)
    const accountQuery = `
          SELECT Id, Name, PersonEmail
          FROM Account
          WHERE PersonEmail = '${userEmail}'
        `;
    console.log("Executing Salesforce account query:", accountQuery);
    const accountResult = await conn.query(accountQuery);
    console.log(`Salesforce account query returned ${accountResult.totalSize} record(s):`, accountResult.records);
    
    if (accountResult.totalSize === 0) {
      console.error("No matching Salesforce account found for email:", userEmail);
      return NextResponse.json({ success: false, message: 'No matching account found' }, { status: 404 });
    } else if (accountResult.totalSize > 1) {
      console.log('Multiple matching accounts found. Returning accounts array for selection.');
      return NextResponse.json({ success: true, accounts: accountResult.records });
    } else {
      const account = accountResult.records[0];
      console.log("Retrieved Salesforce account:", account);
      // Query Salesforce for Opportunities related to the account
      const oppQuery = `
            SELECT Id, Name, StageName, CloseDate, Amount, AccountId
            FROM Opportunity
            WHERE AccountId = '${account.Id}'
          `;
      console.log("Executing Salesforce opportunities query:", oppQuery);
      const oppResult = await conn.query(oppQuery);
      console.log(`Salesforce opportunities query returned ${oppResult.totalSize} record(s):`, oppResult.records);
      return NextResponse.json({ success: true, account, opportunities: oppResult.records });
    }
  } catch (error) {
    console.error("Salesforce Error in GET /api/salesforce route:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}