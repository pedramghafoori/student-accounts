// app/api/salesforce/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import jsforce from 'jsforce';

// Example: Suppose you import a helper that returns your stored tokens.
// Adjust this import path and variable names as needed.
import { getOAuth2 } from '@/lib/salesforce';
import redisClient from '@/lib/redisClient';

async function getSystemTokensFromRedis() {
    const tokenString = await redisClient.get('salesforce_tokens');
    if (!tokenString) return { accessToken: null, refreshToken: null, instanceUrl: null };
    return JSON.parse(tokenString);
}

export async function GET() {
  try {
    console.log("Starting GET /api/salesforce route");
    // 1) Retrieve the JWT from our cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('userToken')?.value;
    console.log("JWT token from cookie:", token);
    if (!token) {
      console.error("No user token found in cookies");
      return NextResponse.json(
        { success: false, message: 'No user token found' },
        { status: 401 }
      );
    }

    // 2) Decode/verify the token to get email
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
     console.log("Token decoded successfully:", decoded);
    } catch (err) {
     console.error("Token verification failed:", err);
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
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
     
    // If this returns null/undefined for any tokens, you need to handle that (e.g., 401 error).

    // 4) Connect to Salesforce with existing OAuth tokens
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),     // If you need the same OAuth2 config for refresh logic
      accessToken,             // The stored access token
      refreshToken,            // The stored refresh token (optional but recommended)
      instanceUrl              // The user’s instance URL from the OAuth callback
    });
    console.log("Created Salesforce connection with tokens");

        // 5) Query Salesforce for the Account record using PersonEmail on the Account object (Person Account)
        const accountQuery = `
          SELECT Id, Name, PersonEmail
          FROM Account
          WHERE PersonEmail = '${userEmail}'
          LIMIT 1
        `;
        console.log("Executing Salesforce account query:", accountQuery);
        const accountResult = await conn.query(accountQuery);
        console.log(`Salesforce account query returned ${accountResult.totalSize} record(s):`, accountResult.records);
    
        if (accountResult.totalSize === 0) {
          console.error("No matching Salesforce account found for email:", userEmail);
          return NextResponse.json(
            { success: false, message: 'No matching account found' },
            { status: 404 }
          );
        }
        const account = accountResult.records[0];
        console.log("Retrieved Salesforce account:", account);
    
        // 6) Query Salesforce for Opportunities related to the account
        const oppQuery = `
          SELECT Id, Name, StageName, CloseDate, Amount, AccountId
          FROM Opportunity
          WHERE AccountId = '${account.Id}'
        `;
        console.log("Executing Salesforce opportunities query:", oppQuery);
        const oppResult = await conn.query(oppQuery);
        console.log(`Salesforce opportunities query returned ${oppResult.totalSize} record(s):`, oppResult.records);
  
        // 7) Return both the account and the related opportunities
        return NextResponse.json({
          success: true,
          account,
          opportunities: oppResult.records,
        });
  } catch (error) {
    console.error("Salesforce Error in GET /api/salesforce route:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}