import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import jsforce from 'jsforce';
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

    console.log("Starting GET /api/salesforce/account route");
    // 1) Retrieve the JWT from our cookie
    const cookieStore = cookies();
    const token = cookieStore.get('userToken')?.value;
    console.log("JWT token from cookie:", token);
    if (!token) {
      console.error("No user token found in cookies");
      return NextResponse.redirect(new URL('/login?reason=expired', request.url));
    }

    // 2) Decode/verify the token to get email
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);
    } catch (err) {
      console.error("Token verification failed:", err);
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

    // 5) Query Salesforce for the Account record using PersonEmail
    const accountQuery = `
          SELECT Id, Name, PersonEmail, Phone, PersonBirthdate,
                 Emergency_Contact_Name__pc, Emergency_Contact_Number__c,
                 LSS_Member_ID__c, PersonMailingStreet, PersonMailingCity,
                 PersonMailingState, PersonMailingPostalCode, PersonMailingCountry
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
      // Format the mailing address
      account.PersonMailingAddress = {
        street: account.PersonMailingStreet,
        city: account.PersonMailingCity,
        state: account.PersonMailingState,
        postalCode: account.PersonMailingPostalCode,
        country: account.PersonMailingCountry
      };
      console.log("Retrieved Salesforce account with formatted address:", account);
      return NextResponse.json({ success: true, account });
    }
  } catch (error) {
    console.error("Salesforce Error in GET /api/salesforce/account route:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 