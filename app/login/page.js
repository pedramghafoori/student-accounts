"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

// This component contains all the login logic and uses the useSearchParams hook
function LoginContent() {
  // Read query parameters for a logout reason
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason"); // e.g., 'inactive'
  const [logoutMessage, setLogoutMessage] = useState("");

  useEffect(() => {
    if (reason === "inactive") {
      setLogoutMessage("You’ve been logged out due to inactivity. Please log in again.");
    }
  }, [reason]);

  const router = useRouter();
  
  const [step, setStep] = useState("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");

  // Track magic link and OTP state
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkCountdown, setMagicLinkCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [emailError, setEmailError] = useState(false);

  useEffect(() => {
    if (magicLinkCountdown > 0) {
      const timer = setTimeout(() => setMagicLinkCountdown(magicLinkCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [magicLinkCountdown]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  function handleEmailError(errorMessage) {
    setStatus(errorMessage);
    setEmailError(true);
  }

  const handleSendOtp = async () => {
    try {
      setStatus("Sending OTP...");
      setEmailError(false);
      await axios.post("/api/auth", { action: "send-otp", email });
      setStatus("OTP sent! Check your email.");
      setStep("OTP");
      setOtpSent(true);
      setOtpCountdown(15);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          handleEmailError(
            "You must provide the email address you used during registration."
          );
        } else if (err.response.status === 404) {
          handleEmailError(
            "Email not found. Please check that you've entered your email correctly."
          );
        } else {
          setStatus("Error sending OTP: " + err.message);
        }
      } else {
        setStatus("Error sending OTP: " + err.message);
      }
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

  const handleSendMagicLink = async () => {
    try {
      setStatus("Sending magic link...");
      setEmailError(false);
      await axios.post("/api/auth", { action: "send-magic-link", email });
      setStatus("Magic link sent! Check your email.");
      setMagicLinkSent(true);
      setMagicLinkCountdown(15);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 400) {
          handleEmailError(
            "You must provide the email address you used during registration."
          );
        } else if (err.response.status === 404) {
          handleEmailError(
            "Email not found. Please check that you've entered your email correctly."
          );
        } else {
          setStatus("Error sending magic link: " + err.message);
        }
      } else {
        setStatus("Error sending magic link: " + err.message);
      }
    }
  };

  const isLoading =
    status === "Sending OTP..." || status === "Sending magic link...";

  const emailInputClasses = `
    border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all
    ${emailError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-700"}
  `;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top header */}
      <div className="bg-blue-500 text-white text-center py-4">
        <h1 className="text-lg font-semibold">Login</h1>
      </div>

      {/* Logout message if reason is inactive */}
      {logoutMessage && (
        <div className="p-3 text-center text-red-600">
          {logoutMessage}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border border-gray-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-8">
            Welcome to Self-Serve Portal
          </h2>

          {step === "EMAIL" && (
            <p className="text-center text-sm text-gray-600 mb-8">
              Please enter the email you used during registration, and we’ll send you a link or OTP.
            </p>
          )}

          {/* Step 1: Email Input */}
          <div className={`${step === "EMAIL" ? "block" : "hidden"} flex flex-col space-y-4`}>
            <label className="flex items-center text-sm font-medium text-gray-700">
              <svg
                className="w-4 h-4 mr-1 text-gray-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.25 4.5a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v.414l-9 6.75-9-6.75V4.5zM2.25 7.636V19.5A2.25 2.25 0 0 0 4.5 21.75h15a2.25 2.25 0 0 0 2.25-2.25V7.636l-8.459 6.348a.75.75 0 0 1-.882 0L2.25 7.636z" />
              </svg>
              Enter your email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailInputClasses}
            />

            <button
              onClick={handleSendMagicLink}
              disabled={magicLinkCountdown > 0}
              className="w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {magicLinkCountdown > 0
                ? `Resend Link in ${magicLinkCountdown}s`
                : magicLinkSent
                ? "Resend Magic Link"
                : "Send Magic Link"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Or{` `}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpCountdown > 0}
                className={`text-blue-800 hover:underline hover:font-medium ${
                  otpCountdown > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {otpCountdown > 0
                  ? `Resend OTP in ${otpCountdown}s`
                  : otpSent
                  ? "Resend OTP"
                  : "Use OTP instead"}
              </button>
            </p>
          </div>

          {/* Step 2: OTP Verification */}
          <div className={`${step === "OTP" ? "block" : "hidden"} flex flex-col space-y-4`}>
            <label className="flex items-center text-sm font-medium text-gray-700">
              <svg
                className="w-4 h-4 mr-1 text-gray-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.25a4.5 4.5 0 0 0-4.495 4.284l-.005.216v2.25h-1.5A1.5 1.5 0 0 0 4.5 10.5v10.5A1.5 1.5 0 0 0 6 22.5h12a1.5 1.5 0 0 0 1.5-1.5V10.5a1.5 1.5 0 0 0-1.5-1.5h-1.5v-2.25a4.5 4.5 0 0 0-4.5-4.5zm0 3a1.5 1.5 0 0 1 1.493 1.356l.007.144v2.25h-3v-2.25A1.5 1.5 0 0 1 12 5.25z" />
              </svg>
              Enter the OTP sent to {email}:
            </label>
            <input
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700 transition-all"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors"
            >
              Verify & Login
            </button>
          </div>

          {status && (
            <div className="mt-4 text-sm text-center text-gray-600">
              {status}
              {isLoading && (
                <div className="flex justify-center mt-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// The default export wraps the LoginContent component in a Suspense boundary,
// which is required for components using useSearchParams to handle asynchronous rendering gracefully.
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}