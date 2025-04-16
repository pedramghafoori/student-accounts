"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const handleConfirm = async () => {
    try {
      const formData = new FormData();
      formData.append('token', token);

      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to confirm login');
      }

      const data = await response.json();
      
      // Redirect to dashboard after successful confirmation
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error confirming login:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Confirm Your Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to complete your login
          </p>
        </div>
        <div>
          <button
            onClick={handleConfirm}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Confirm Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  );
}