"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");

  const handleSendOtp = async () => {
    try {
      setStatus("Sending OTP...");
      await axios.post("/api/auth", { action: "send-otp", email });
      setStatus("OTP sent! Check your email.");
      setStep("OTP");
    } catch (err) {
      setStatus("Error sending OTP: " + err.message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setStatus("Verifying OTP...");
      await axios.post("/api/auth", { action: "verify-otp", email, otp });
      setStatus("Success! Redirecting...");
      router.push("/dashboard");
    } catch (err) {
      setStatus("Invalid OTP or error: " + err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Welcome to Self-Serve Portal
        </h1>

        {/* Step 1: Collect Email */}
        {step === "EMAIL" && (
          <div className="flex flex-col space-y-4">
            <label className="text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSendOtp}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Send OTP
            </button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {step === "OTP" && (
          <div className="flex flex-col space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Enter the OTP sent to {email}:
            </label>
            <input
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Verify & Login
            </button>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <p className="mt-4 text-sm text-gray-600 text-center">{status}</p>
        )}
      </div>
    </div>
  );
}