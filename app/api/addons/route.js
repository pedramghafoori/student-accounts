/**
 * /app/api/addons/route.js
 * Option C: We do a second query on Product2 to find the code (e.g. from Course_Code__c).
 * 1) Query Batch_Enrolment__c => get Product2 ID from Batch__r.Product__c.
 * 2) Query that Product2 record => read a code field (e.g. Course_Code__c).
 * 3) Query Product2 again filtering by Family + multi-picklist includes that code.
 */

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import jsforce from 'jsforce';
import { getOAuth2 } from '@/lib/salesforce';
import redisClient from '@/lib/redisClient';
import { getCourseCode } from '@/lib/coursecodes';

console.log('=> [Global] /api/addons/route.js loaded');

async function getSystemTokensFromRedis() {
  console.log('=> [getSystemTokensFromRedis] invoked');
  const tokenString = await redisClient.get('salesforce_tokens');
  console.log('=> [getSystemTokensFromRedis] tokenString from Redis:', tokenString);

  if (!tokenString) {
    console.log('=> [getSystemTokensFromRedis] No tokens found');
    return { accessToken: null, refreshToken: null, instanceUrl: null };
  }
  console.log('=> [getSystemTokensFromRedis] Parsing tokens');
  return JSON.parse(tokenString);
}

export async function GET(request) {
  console.log('=> [GET] Entering /api/addons route (Option C: second Product2 query)');
  try {
    console.log('=> [GET] Checking request method:', request.method);
    if (request.method === 'HEAD') {
      console.log('HEAD request for /api/addons - skipping token usage');
      return NextResponse.json({ success: true, message: 'HEAD request, token not used' });
    }

    console.log('Starting GET /api/addons route');

    // 1) Retrieve JWT from cookies
    const cookieStore = await cookies();
    console.log('=> [GET] cookieStore object created');

    const token = cookieStore.get('userToken')?.value;
    console.log('Cookie token we found:', token);
    if (!token) {
      console.error('No user token found in cookies - redirecting');
      return NextResponse.redirect(new URL('/login?reason=expired', request.url));
    }

    // 2) Decode/verify token
    console.log('=> [GET] Decoding token...');
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
    } catch (err) {
      console.error('Token verification failed:', err);
      return NextResponse.redirect(new URL('/login?reason=expired', request.url));
    }

    // 3) Retrieve enrollmentId from query
    console.log('=> [GET] Parsing query from request.url');
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    console.log('=> [GET] enrollmentId extracted:', enrollmentId);

    if (!enrollmentId) {
      console.log('=> [GET] No enrollmentId provided');
      return NextResponse.json({ success: false, message: 'No enrollmentId provided', products: [] }, { status: 400 });
    }
    console.log('Using enrollmentId for add-ons route:', enrollmentId);

    // 4) Grab tokens from Redis
    console.log('=> [GET] About to call getSystemTokensFromRedis()');
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    console.log('=> [GET] Tokens returned from Redis:', { accessToken, refreshToken, instanceUrl });

    if (!accessToken || !refreshToken || !instanceUrl) {
      console.error('Missing Salesforce tokens from Redis');
      return NextResponse.json({ success: false, message: 'Missing Salesforce tokens' }, { status: 500 });
    }

    // 5) Connect to Salesforce
    console.log('=> [GET] Creating jsforce connection');
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl
    });
    console.log('Salesforce connection created for /api/addons');

    // 6) Query the single enrollment => get the Product2 ID
    console.log('=> [GET] Building enrolmentQuery');
    const enrolmentQuery = `
      SELECT Id, Name, Batch__c,
             Batch__r.Product__c
      FROM Batch_Enrolment__c
      WHERE Id = '${enrollmentId}'
      LIMIT 1
    `;
    console.log('Enrolment query:', enrolmentQuery);
    const enrolmentResult = await conn.query(enrolmentQuery);
    console.log(`Enrolment query returned ${enrolmentResult.totalSize} record(s):`, enrolmentResult.records);

    if (enrolmentResult.totalSize === 0) {
      console.log('No enrollment found => no add-ons');
      return NextResponse.json({ success: false, message: 'No matching enrollment found', products: [] }, { status: 404 });
    }

    const enrollment = enrolmentResult.records[0];
    console.log('Enrollment record:', JSON.stringify(enrollment, null, 2));

    const productId = enrollment.Batch__r?.Product__c;
    console.log('=> [GET] got productId from Batch__r.Product__c:', productId);

    if (!productId) {
      console.log('No Product__c => no course type?');
      return NextResponse.json({ success: true, message: 'No product found on Batch', products: [] });
    }

    // 7) Query Product2 to get the product name and retrieve course code from courseCodes.js
    console.log('=> [GET] Querying Product2 for product name');
    const product2NameQuery = `
      SELECT Id, Name
      FROM Product2
      WHERE Id = '${productId}'
      LIMIT 1
    `;
    console.log('Product2 name query:', product2NameQuery);
    const product2NameResult = await conn.query(product2NameQuery);
    console.log(`Product2 name query returned ${product2NameResult.totalSize} record(s):`, product2NameResult.records);

    if (product2NameResult.totalSize === 0) {
      console.log('No Product2 record found => cannot get product name');
      return NextResponse.json({ success: true, message: 'No product2 found for that ID', products: [] });
    }

    const product2Record = product2NameResult.records[0];
    console.log('=> [GET] product2Record:', JSON.stringify(product2Record, null, 2));

    // Use the product name to get the course code from courseCodes.js
    console.log('=> [GET] Getting course code from courseCodes.js for product name:', product2Record.Name);
    const courseCode = getCourseCode(product2Record.Name);
    console.log('=> [GET] Retrieved course code:', courseCode);

    if (!courseCode) {
      console.log('No course code found for product name:', product2Record.Name);
      return NextResponse.json({ success: true, message: 'No course code found for product name', products: [] });
    }

    // 8) Final query: find all Product2 records where the multi-picklist includes the course code
    console.log('=> [GET] Building final product query with course code:', courseCode);
    const productQuery = `
      SELECT Id, Name, Family, Description, ProductPicture__c,
             (SELECT Id, UnitPrice, Pricebook2.Name 
              FROM PricebookEntries 
              WHERE Pricebook2.Name = 'Standard Price Book' 
              LIMIT 1)
      FROM Product2
      WHERE Family IN ('Resale Products','Reference')
        AND (Products_Optional__c INCLUDES ('${courseCode}')
             OR Products_Required__c INCLUDES ('${courseCode}'))
      LIMIT 100
    `;
    console.log('Final product query:', productQuery);
    const finalResult = await conn.query(productQuery);
    console.log(`=> [GET] final product query returned ${finalResult.totalSize} record(s):`, finalResult.records);

    // Process the results to include the price in a more accessible format
    const processedProducts = finalResult.records.map(product => ({
      ...product,
      UnitPrice: product.PricebookEntries?.records[0]?.UnitPrice || 0
    }));

    console.log('=> [GET] returning final matched products');
    return NextResponse.json({
      success: true,
      enrollment,
      product2Record, // the product2 with the name
      courseCode,
      products: processedProducts || []
    });
  } catch (error) {
    console.error('Error in /api/addons route (Option C second Product2 query):', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}