// api/refund-policy/route.js (Next.js App Router example)
import { NextResponse } from "next/server";
import scrapeRefundPolicy from "@/lib/scraper"; // adjust the path as needed

export async function GET() {
  const policyData = await scrapeRefundPolicy();
  if (!policyData) {
    return NextResponse.json({ success: false, message: "Failed to retrieve policy" }, { status: 500 });
  }
  return NextResponse.json({ success: true, policy: policyData });
}