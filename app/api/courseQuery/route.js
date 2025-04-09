// /app/api/courseQuery/route.js
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

    // Retrieve tokens
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

    // Query standard course enrollments via Account.
    const accountSoql = `
      SELECT
        Id,
        Name,
        (
          SELECT
            Id,
            Name,
            Batch__c,
            Batch__r.Id,
            Batch__r.Name,
            Batch__r.Days_until_Start_Date__c,
            Batch__r.Start_date_time__c,
            Batch__r.Product__r.Name
          FROM Course_Enrolments__r
        )
      FROM Account
      WHERE Id = '${accountId}'
    `;
    console.log('[courseQuery] Running Account SOQL:', accountSoql);
    const accountResult = await conn.query(accountSoql);

    // Query Registration__c for combo enrollments using the correct lookup field (AccountId)
    const registrationSoql = `
      SELECT
        Id,
        Name,
        (
          SELECT
            Id,
            Name,
            Course_Start_Date_Time__c,
            Classroom__c
          FROM Combo_Course_Enrollment__r
        )
      FROM Opportunity
      WHERE AccountId = '${accountId}'
    `;
    console.log('[courseQuery] Running Registration SOQL:', registrationSoql);
    const registrationResult = await conn.query(registrationSoql);
    console.log('[courseQuery] Registration Query Result:', registrationResult.records);

    let enrolments = [];
    // Check if any Registration__c record has combo enrollments.
    if (registrationResult.records && registrationResult.records.length > 0) {
      for (const reg of registrationResult.records) {
        if (
          reg.Combo_Course_Enrollment__r &&
          reg.Combo_Course_Enrollment__r.records &&
          reg.Combo_Course_Enrollment__r.records.length > 0
        ) {
          enrolments = reg.Combo_Course_Enrollment__r.records.map((en) => {
            const startDateTime = en.Course_Start_Date_Time__c;
            const daysUntilStart = startDateTime
              ? Math.ceil((new Date(startDateTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;
            return {
              Id: en.Id,
              EnrolmentName: en.Name,
              BatchId: null,         // Combo enrollments may not have an associated Batch
              BatchLookup: null,
              CourseName: reg.Name || en.Name,
              ProductName: null,     // Map a product field here if applicable
              DaysUntilStart: daysUntilStart,
              StartDateTime: startDateTime,
              Classroom: en.Classroom__c,
              isCombo: true          // Optional flag to indicate combo enrollment
            };
          });
          // If one registration record returns combo enrollments, we use them.
          break;
        }
      }
    }

    // If no combo enrollments exist, fall back to standard enrollments from Account.
    if (enrolments.length === 0 && accountResult.records && accountResult.records.length > 0) {
      const acc = accountResult.records[0];
      if (acc.Course_Enrolments__r && acc.Course_Enrolments__r.records) {
        enrolments = acc.Course_Enrolments__r.records.map((en) => ({
          Id: en.Id,
          EnrolmentName: en.Name,
          BatchId: en.Batch__r?.Id,
          BatchLookup: en.Batch__c,
          CourseName: en.Batch__r?.Name,
          ProductName: en.Batch__r?.Product__r?.Name,
          DaysUntilStart: en.Batch__r?.Days_until_Start_Date__c,
          StartDateTime: en.Batch__r?.Start_date_time__c,
          isCombo: false
        }));
      }
    }

    // Transform the final record to a unified structure.
    const transformedRecords = accountResult.records.map((acc) => ({
      AccountId: acc.Id,
      AccountName: acc.Name,
      Enrolments: enrolments
    }));

    return NextResponse.json({
      success: true,
      records: transformedRecords,
    });
  } catch (error) {
    console.error('Error in courseQuery route:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}