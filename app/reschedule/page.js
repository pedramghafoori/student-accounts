"use client";

import React, { Suspense } from "react";
import { RescheduleImpl } from "./RescheduleImpl";

export const dynamic = "force-dynamic";

export default function RescheduleSuspensePage() {
  return (
    <Suspense fallback={<div>Loading Reschedule Page...</div>}>
      <RescheduleImpl />
    </Suspense>
  );
}