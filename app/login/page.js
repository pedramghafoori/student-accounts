"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("");

  // Track whether Magic Link or OTP has been sent, and handle "resend" timers
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkCountdown, setMagicLinkCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Error states for fields
  const [emailError, setEmailError] = useState(false);

  // Decrement Magic Link countdown
  useEffect(() => {
    if (magicLinkCountdown > 0) {
      const timer = setTimeout(
        () => setMagicLinkCountdown(magicLinkCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [magicLinkCountdown]);

  // Decrement OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Helper to handle email-related errors
  function handleEmailError(errorMessage) {
    setStatus(errorMessage);
    setEmailError(true);
  }

  // Existing OTP logic
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

  // Magic Link logic
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

  // Simple loading check
  const isLoading =
    status === "Sending OTP..." || status === "Sending magic link...";

  // Determine classes for the email input (red outline on error)
  const emailInputClasses = `border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all
    ${emailError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-700"}
  `;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 p-6 rounded-lg shadow-lg transition-all">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-8">
          Welcome to Self-Serve Portal
        </h1>

        {/* Show instructions only on the "EMAIL" step */}
        {step === "EMAIL" && (
          <p className="text-center text-sm text-gray-600 mb-8">
            Please enter the email you used during registration, and we’ll send you a link to log in automatically.
          </p>
        )}

        {/* Step 1: Collect Email */}
        <div
          className={`${
            step === "EMAIL" ? "opacity-100" : "opacity-0 hidden"
          } transition-opacity duration-500 ease-in-out flex flex-col space-y-4`}
        >
          <label className="flex items-center text-sm font-medium text-gray-700">
            {/* Mail Icon */}
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

          {/* Magic Link Button */}
          <button
            onClick={handleSendMagicLink}
            disabled={magicLinkCountdown > 0}
            className="transform hover:scale-105 w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {magicLinkCountdown > 0
              ? `Resend in ${magicLinkCountdown}s`
              : magicLinkSent
              ? "Resend Magic Link"
              : "Send Magic Link"}
          </button>

          {/* "Use OTP instead" link (doubles as "Resend OTP" if OTP was previously sent) */}
          <p className="text-center text-sm text-gray-500">
            Or{" "}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpCountdown > 0}
              className={`text-blue-800 hover:underline hover:font-medium ${
                otpCountdown > 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {otpCountdown > 0
                ? `Resend in ${otpCountdown}s`
                : otpSent
                ? "Resend OTP"
                : "log in using OTP"}
            </button>
          </p>
        </div>

        {/* Step 2: Verify OTP */}
        <div
          className={`mt-2 ${
            step === "OTP" ? "opacity-100" : "opacity-0 hidden"
          } transition-opacity duration-500 ease-in-out flex flex-col space-y-4`}
        >
          <label className="flex items-center text-sm font-medium text-gray-700">
            {/* Lock Icon */}
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
            className="transform hover:scale-105 w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors"
          >
            Verify &amp; Login
          </button>
        </div>

        {/* Status Message + optional spinner */}
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
  );
}