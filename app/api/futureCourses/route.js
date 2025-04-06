import { NextResponse } from "next/server";
import jsforce from "jsforce";
import { getSystemTokensFromRedis, getOAuth2 } from "@/lib/salesforce";

export async function GET(request) {
  console.log("GET request received:", request.url);
  try {
    // Parse request URL and extract courseType
    console.log("Parsing request URL...");
    const { searchParams } = new URL(request.url);
    const courseType = searchParams.get("courseType");
    console.log("courseType:", courseType);
    if (!courseType) {
      console.error("No courseType provided");
      return NextResponse.json({ success: false, message: "No courseType provided" }, { status: 400 });
    }

    // Retrieve Salesforce tokens from Redis
    console.log("Fetching Salesforce tokens from Redis...");
    const tokens = await getSystemTokensFromRedis();
    console.log("Tokens retrieved:", tokens);
    const { accessToken, refreshToken, instanceUrl } = tokens;
    if (!accessToken || !refreshToken || !instanceUrl) {
      console.error("Salesforce tokens missing", { accessToken, refreshToken, instanceUrl });
      return NextResponse.json({ success: false, message: "Salesforce tokens missing" }, { status: 500 });
    }

    // Create jsforce connection
    console.log("Initializing jsforce connection...");
    const conn = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl,
    });
    console.log("jsforce connection initialized");

    // First, query for the Product record to get its Id using the provided courseType as Name
    // Note: Standard Salesforce product object is Product2, not Product__c.
    const productQuery = `
      SELECT Id 
      FROM Product2
      WHERE Name = '${courseType}'
      LIMIT 1
    `;
    console.log("Executing product query:", productQuery);
    const productResult = await conn.query(productQuery);
    console.log("Product query result:", productResult);

    if (productResult.records.length === 0) {
      console.error("No product record found for courseType:", courseType);
      return NextResponse.json({ success: false, message: "No product record found" }, { status: 404 });
    }
    const productId = productResult.records[0].Id;
    console.log("Found productId:", productId);

    // Build the SOQL query for future courses using the retrieved productId
    const query = `
      SELECT Id, Name, Start_date_time__c, Location__c
      FROM Batch__c
      WHERE Product__c = '${productId}' AND Start_date_time__c > TODAY
      ORDER BY Start_date_time__c ASC
    `;
    console.log("SOQL Query:", query);

    // Execute the query for future courses
    console.log("Executing courses query...");
    const result = await conn.query(query);
    console.log("Courses query result:", result);

    // Return successful response with courses data
    console.log("Returning successful response with courses data");
    return NextResponse.json({ success: true, courses: result.records });
  } catch (err) {
    console.error("Error in GET /futureCourses:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}