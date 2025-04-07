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

    // The SOQL query
    const soql = `
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
    console.log('[courseQuery] Running SOQL:', soql);

    const result = await conn.query(soql);
    console.log('[courseQuery] Query Result Records:', result.records);

    // Log the subrecords if they exist
    if (result.records.length > 0 && result.records[0].Course_Enrolments__r) {
      console.log(
        'Subrecords:',
        result.records[0].Course_Enrolments__r.records
      );
    }

    // Transform the data, flattening the nested fields
    const transformedRecords = result.records.map((acc) => {
      let enrolments = [];
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
        }));
      }

      return {
        AccountId: acc.Id,
        AccountName: acc.Name,
        Enrolments: enrolments,
      };
    });

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