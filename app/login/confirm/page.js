"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("");

  async function handleConfirm() {
    try {
      setStatus("Confirming...");
      
      // Create form data with the token
      const formData = new FormData();
      formData.append("token", token);

      // Make a POST request to the magic-link endpoint
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to confirm login");
      }

      // The magic-link endpoint will handle setting the cookie and redirecting
      // No need to do anything else here
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  const isLoading = status === "Confirming...";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 p-6 rounded-lg shadow-lg transition-all">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-8">
          Confirm Login
        </h1>

        <p className="text-center text-sm text-gray-600 mb-8">
          Please confirm your login below.
        </p>

        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="transform hover:scale-105 w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Confirm Login"}
        </button>

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