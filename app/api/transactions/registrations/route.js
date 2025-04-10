// /app/api/transactions/registrations/route.js
import { NextResponse } from 'next/server';
import jsforce from 'jsforce';
import { getSystemTokensFromRedis, getOAuth2 } from '@/lib/salesforce';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'No accountId provided' },
        { status: 400 }
      );
    }

    // Retrieve tokens (adjust if you have your own logic for retrieving SF tokens)
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    if (!accessToken || !refreshToken || !instanceUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing Salesforce tokens' },
        { status: 500 }
      );
    }

    // Create JSforce connection
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl,
    });

    // Query Opportunities (Registrations) with child Transactions__c records
    // to retrieve Transaction_Reference__c
    const soql = `
      SELECT
        Id,
        Name,
        Registration_Number__c,
        CloseDate,
        Course_Amount__c,
        Discount_Amount__c,
        Net_Tax__c,
        Add_On_Amount__c,
        Total_Captured__c,
        (
          SELECT
            Id,
            Name,
            Transaction_Reference__c
          FROM Transactions__r
        )
      FROM Opportunity
      WHERE AccountId = '${accountId}'
      ORDER BY CloseDate DESC
    `;
    console.log('[transactions/registrations] Running SOQL:', soql);

    const result = await conn.query(soql);
    console.log('[transactions/registrations] SF query result:', result.totalSize, 'records');

    // Transform to a simpler structure if desired, or return directly.
    return NextResponse.json({
      success: true,
      records: result.records || [],
    });
  } catch (error) {
    console.error('Error in registrations route:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}