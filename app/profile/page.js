"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { selectedAccount, setSelectedAccount, allAccounts } = React.useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  useEffect(() => {
    if (!selectedAccount && allAccounts && allAccounts.length > 0) {
      setSelectedAccount(allAccounts[0]);
    }
    setLoading(false);
  }, [selectedAccount, allAccounts, setSelectedAccount]);

  const handleSelect = (id) => {
    const selected = allAccounts.find(acc => acc.Id === id);
    setSelectedAccount(selected);
  };

  const handleLogout = () => {
    setSelectedAccount(null);
    router.push("/login");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = (address) => {
    if (!address) return "Not available";
    const { street, city, state, postalCode, country } = address;
    return `${street || ''}\n${city || ''}, ${state || ''} ${postalCode || ''}\n${country || ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          selectedAccount={null}
          headerTagline="Profile"
          accounts={allAccounts || []}
          showAccountDropdown={showAccountDropdown}
          setShowAccountDropdown={setShowAccountDropdown}
          handleSelect={handleSelect}
          handleLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-500">Loading profile information...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-white">
        <Header 
          selectedAccount={null}
          headerTagline="Profile"
          accounts={allAccounts || []}
          showAccountDropdown={showAccountDropdown}
          setShowAccountDropdown={setShowAccountDropdown}
          handleSelect={handleSelect}
          handleLogout={handleLogout}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center text-gray-500">Please select an account to view profile information</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        selectedAccount={selectedAccount}
        headerTagline="Profile"
        accounts={allAccounts || []}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center mb-6">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20.2832 19.9316"
              width="48"
              height="48"
              className="mb-4"
            >
              <g>
                <rect height="19.9316" opacity="0" width="20.2832" x="0" y="0" />
                <path
                  d="M19.9219 9.96094C19.9219 15.4492 15.459 19.9219 9.96094 19.9219C4.47266 19.9219 0 15.4492 0 9.96094C0 4.46289 4.47266 0 9.96094 0C15.459 0 19.9219 4.46289 19.9219 9.96094ZM3.95508 15.9277C5.44922 17.5195 7.71484 18.4375 9.95117 18.4375C12.1973 18.4375 14.4531 17.5195 15.957 15.9277C14.8926 14.248 12.5781 13.291 9.95117 13.291C7.30469 13.291 5.00977 14.2676 3.95508 15.9277ZM6.60156 7.94922C6.60156 10.0488 8.07617 11.6113 9.95117 11.6309C11.8359 11.6504 13.3008 10.0488 13.3008 7.94922C13.3008 5.97656 11.8262 4.33594 9.95117 4.33594C8.08594 4.33594 6.5918 5.97656 6.60156 7.94922Z"
                  fill="#007aff"
                />
              </g>
            </svg>
            <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          </div>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Account Name</h2>
              <p className="text-lg text-gray-800">{selectedAccount?.Name || "Not available"}</p>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Phone</h2>
              <p className="text-lg text-gray-800">{selectedAccount?.Phone || "Not available"}</p>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Email</h2>
              <p className="text-lg text-gray-800">{selectedAccount?.PersonEmail || "Not available"}</p>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Birthdate</h2>
              <p className="text-lg text-gray-800">{formatDate(selectedAccount?.PersonBirthdate)}</p>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Emergency Contact</h2>
              <p className="text-lg text-gray-800">{selectedAccount?.Emergency_Contact_Name__c || "Not available"}</p>
              <p className="text-sm text-gray-600">{selectedAccount?.Emergency_Contact_Number__c || "Not available"}</p>
            </div>

            <div className="border-b pb-4">
              <h2 className="text-sm font-medium text-gray-500 mb-1">LSS ID</h2>
              <p className="text-lg text-gray-800">{selectedAccount?.LSS_Member_ID__c || "Not available"}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-1">Mailing Address</h2>
              <p className="text-lg text-gray-800 whitespace-pre-line">
                {formatAddress(selectedAccount?.PersonMailingAddress)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 