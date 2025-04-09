import { NextResponse } from "next/server";
import axios from "axios";
import { getSystemTokensFromRedis, getOAuth2 } from "@/lib/salesforce";

export async function POST(request) {
  try {
    // 1) Parse request body
    const body = await request.json();
    console.log("[reschedule] Parsed body:", body);
    // Use varOldEnrollmentId and varNewCourseId from the request body
    const { varOldEnrollmentId, varNewCourseId, varSelectedEnrollments, varSelectedComboEnrollments } = body;
    console.log("[reschedule] varSelectedEnrollments received:", varSelectedEnrollments);
    console.log("[reschedule] varSelectedComboEnrollments received:", varSelectedComboEnrollments);

    if (varSelectedEnrollments && !Array.isArray(varSelectedEnrollments)) {
      console.warn("[reschedule] varSelectedEnrollments is not an array. Converting to empty array.");
    }

    // Basic validation
    if (!varNewCourseId) {
      return NextResponse.json({ success: false, message: "Missing varNewCourseId." }, { status: 400 });
    }
    if (!varOldEnrollmentId) {
      return NextResponse.json({ success: false, message: "Missing varOldEnrollmentId." }, { status: 400 });
    }
    console.log("[reschedule] varNewCourseId and varOldEnrollmentId are present, proceeding...");

    // 2) Retrieve tokens (Access Token, Instance URL) from Redis
    const { accessToken, refreshToken, instanceUrl } = await getSystemTokensFromRedis();
    if (!accessToken || !refreshToken || !instanceUrl) {
      return NextResponse.json(
        { success: false, message: "Missing Salesforce tokens" },
        { status: 500 }
      );
    }
    console.log("[reschedule] Retrieved tokens from Redis:", { accessToken: accessToken?.slice(0, 6), instanceUrl });

    // 3) Build the Flow REST API URL
    // This example uses the v63.0 endpoint for Autolaunched Flows
    // Replace 'Auto_Rescheduling' with your flow’s actual API Name
    const flowApiName = "Auto_Rescheduling_3";
    const flowUrl = `${instanceUrl}/services/data/v63.0/actions/custom/flow/${flowApiName}`;

    // 4) Construct the request payload to pass into the flow
    // NOTE: The variable names must match exactly the ones in your flow.
    console.log("[reschedule] Building flowPayload with:", { varOldEnrollmentId, varNewCourseId});
    const flowPayload = {
      inputs: [
        {
          varOldEnrollmentId,
          varNewCourseId
        }
      ]
    };

    // 5) Make the POST call to Salesforce Flow
    console.log("[reschedule] POSTing to flow URL:", flowUrl);
    console.log("[reschedule] flowPayload:", JSON.stringify(flowPayload, null, 2));
    const res = await axios.post(flowUrl, flowPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    });

    // 6) Check the response
    const data = res.data;
    console.log("[reschedule] Salesforce responded with status:", res.status);
    console.log("[reschedule] Flow response:", JSON.stringify(data, null, 2));

    // 7) Return success
    return NextResponse.json({
      success: true,
      message: "Reschedule flow executed successfully",
      salesforceResponse: data,
    });
  } catch (error) {
    console.error("Error in /api/reschedule/route.js:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}