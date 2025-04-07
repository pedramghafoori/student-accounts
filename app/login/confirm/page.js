"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");

  // Example: handle the final logic when user clicks "Confirm"
  async function handleConfirm() {
    try {
      setStatus("Confirming...");
      // Make a request to finalize the login, or do some other step
      // e.g. await axios.post("/api/magic-link/confirm", { token });
      // Then redirect to dashboard or show success
      router.push("/dashboard");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  const isLoading = status === "Confirming...";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 p-6 rounded-lg shadow-lg transition-all">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-8">
          Confirm Action
        </h1>

        <p className="text-center text-sm text-gray-600 mb-8">
          You’re one step away. Please confirm your login or action below.
        </p>

        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="transform hover:scale-105 w-full py-2 text-sm font-medium text-white bg-blue-800 rounded hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Confirm"}
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