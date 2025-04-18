// /app/api/transactions/registrations/route.js
import { NextResponse } from 'next/server';
import jsforce from 'jsforce';
import { getSystemTokensFromRedis, getOAuth2 } from '@/lib/salesforce';

// Create a connection pool
let connectionPool = null;
let lastTokenRefresh = 0;
const TOKEN_REFRESH_INTERVAL = 3600000; // 1 hour

// In-memory cache for registrations
const registrationsCache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getConnection() {
  const now = Date.now();
  
  // Check if we need to refresh the connection
  if (!connectionPool || (now - lastTokenRefresh) > TOKEN_REFRESH_INTERVAL) {
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    if (!accessToken || !refreshToken || !instanceUrl) {
      throw new Error('Missing Salesforce tokens');
    }

    connectionPool = new jsforce.Connection({
      oauth2: getOAuth2(),
      accessToken,
      refreshToken,
      instanceUrl,
    });
    
    lastTokenRefresh = now;
  }
  
  return connectionPool;
}

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

    // Check cache first
    const cacheKey = `registrations:${accountId}`;
    const cachedData = registrationsCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        records: cachedData.records,
        fromCache: true,
      });
    }

    // Get connection from pool
    const conn = await getConnection();

    // Query Opportunities with child Transactions
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

    const result = await conn.query(soql);

    // Cache the result
    registrationsCache.set(cacheKey, {
      records: result.records,
      timestamp: Date.now(),
    });

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