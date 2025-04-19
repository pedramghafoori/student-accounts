"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('token', token);

      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      });

      if (response.url.includes('/courses')) {
        window.location.href = '/courses';
      } else if (!response.ok) {
        const data = await response.json();
        if (data.message === 'This link has already been used') {
          throw new Error('This login link has already been used. You are already logged in. Click here to go to your courses.');
        } else {
          throw new Error(data.message || 'Failed to confirm login');
        }
      }
      
    } catch (error) {
      console.error('Error confirming login:', error);
      setError(error.message);
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            {error.includes('already been used') && (
              <div className="mt-4 text-center">
                <a 
                  href="/courses" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Go to Courses
                </a>
              </div>
            )}
          </div>
        )}
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
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}