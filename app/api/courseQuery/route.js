import { getSystemTokensFromRedis, getOAuth2 } from '@/lib/salesforce';
import { NextResponse } from 'next/server';
import jsforce from 'jsforce';

// This route queries Batch__c records for a specific Account
// Usage: GET /api/courseQuery?accountId=someId
export async function GET(request) {
  try {
    // 1) Parse the accountId from the query string
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    console.log('[courseQuery] Received accountId:', accountId);
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'No accountId provided' },
        { status: 400 }
      );
    }

    // 2) Retrieve Salesforce tokens from Redis (or another store)
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    console.log('[courseQuery] Tokens from Redis:', { accessToken, refreshToken, instanceUrl });
    if (!accessToken || !refreshToken || !instanceUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing Salesforce tokens' },
        { status: 500 }
      );
    }

    // 3) Create the jsforce connection
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl,
    });

    // 4) Run the SOQL query for related Batch__c records
    const soql = `
      SELECT Id, Name, Product__c, Days_until_Start_Date__c, Start_Date_Time__c
      FROM Batch__c
      WHERE Id IN (
        SELECT Batch__c
        FROM Batch_Enrolment__c
        WHERE Account__c = '${accountId}'
      )
    `;
    console.log('[courseQuery] Running SOQL:', soql);
    const result = await conn.query(soql);
    console.log('[courseQuery] Query Result Records:', result.records);

    // 5) Return the records
    return NextResponse.json({ success: true, records: result.records });
  } catch (error) {
    console.error('Error in courseQuery route:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}