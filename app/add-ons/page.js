"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header";
import Image from 'next/image';

export default function AddOnProductsPage() {
  const router = useRouter();
  const { selectedAccount } = useContext(AppContext);

  // Local state
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState("");
  const [products, setProducts] = useState([]); // opportunity products
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalCharge, setTotalCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transactionRef, setTransactionRef] = useState(null);
  const [error, setError] = useState(null);

  // 1. Fetch registrations (Opportunity records) from your existing route
  // Note: you may need to ensure the route returns any associated 'OpportunityProducts'
  useEffect(() => {
    // If no account is selected, possibly show an error or skip the fetch
    if (!selectedAccount || !selectedAccount.Id) {
      return;
    }

    // We assume your existing route is /api/transactions/registrations?accountId=...
    // Make sure that route returns 'OpportunityProducts' with Family, Price, Description, etc.

    const fetchRegistrations = async () => {
      try {
        const res = await fetch(
          `/api/transactions/registrations?accountId=${selectedAccount.Id}`
        );
        const data = await res.json();
        if (data.success && data.records && data.records.length > 0) {
          setRegistrations(data.records);
          // By default, pick the first registration
          const firstReg = data.records[0];
          setSelectedRegistrationId(firstReg.Id);
          // If your route includes 'OpportunityProducts' on each registration, filter them here
          if (firstReg.OpportunityProducts) {
            const filtered = firstReg.OpportunityProducts.filter(
              (prod) =>
                prod.Family === "Reference Materials" ||
                prod.Family === "Resale Products"
            );
            setProducts(filtered);
          }
        } else {
          setError(
            data.message ||
              "No registrations found or the route did not return the needed data."
          );
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRegistrations();
  }, [selectedAccount]);

  // 2. When user changes registration selection, reload the products
  useEffect(() => {
    if (!selectedRegistrationId || registrations.length === 0) {
      return;
    }
    const foundReg = registrations.find((r) => r.Id === selectedRegistrationId);
    if (foundReg && foundReg.OpportunityProducts) {
      const filtered = foundReg.OpportunityProducts.filter(
        (prod) =>
          prod.Family === "Reference Materials" ||
          prod.Family === "Resale Products"
      );
      setProducts(filtered);
      setSelectedProducts([]);
      setTotalCharge(0);
    } else {
      setProducts([]);
      setSelectedProducts([]);
      setTotalCharge(0);
    }
  }, [selectedRegistrationId, registrations]);

  // 3. Toggle product selection
  const toggleSelectProduct = (product) => {
    let updated;
    if (selectedProducts.some((p) => p.id === product.id)) {
      updated = selectedProducts.filter((p) => p.id !== product.id);
    } else {
      updated = [...selectedProducts, product];
    }
    setSelectedProducts(updated);
    const total = updated.reduce(
      (sum, prod) => sum + parseFloat(prod.price || 0),
      0
    );
    setTotalCharge(total);
  };

  // 4. Confirm purchase
  const confirmPurchase = async () => {
    if (!selectedRegistrationId || selectedProducts.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);

    const productIds = selectedProducts.map((p) => p.id).join(",");
    const payload = {
      Opportunity_Id_Input: selectedRegistrationId,
      Comma_Separated_Product_Ids_Input: productIds,
      Total_Add_On_Amount: totalCharge,
    };

    try {
      const res = await fetch("/api/invoke-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setTransactionRef(json.transactionReference);
      } else {
        setError(json.message || "Flow invocation failed");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // 5. Theming: Use a container and tailwind classes for styling to match your Dashboard page
  return (
    <>
      {/* Bring in your Header from Dashboard's style, with matching props. */}
      <Header
        headerTagline="Add-On Products"
        selectedAccount={selectedAccount}
        accounts={selectedAccount ? [selectedAccount] : []}
        showAccountDropdown={false}
        setShowAccountDropdown={() => {}}
        handleSelect={() => {}}
        handleLogout={() => router.push("/login")} // or your logout method
      />

      {/* Main content area, adopting similar tailwind classes */}
      <div className="p-6">
        {error && (
          <div className="text-red-600 mb-4">Error: {error}</div>
        )}

        {selectedAccount ? (
          <h1 className="text-2xl font-semibold mb-4">
            Additional Purchases for {selectedAccount.Name}
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold mb-4">
            Please select an account from the header
          </h1>
        )}

        {/* Registration selection dropdown */}
        {registrations.length > 0 && (
          <div className="mb-6 bg-white shadow p-4 rounded">
            <label htmlFor="registration-select" className="block font-semibold mb-2">
              Select Registration
            </label>
            <select
              id="registration-select"
              value={selectedRegistrationId}
              onChange={(e) => setSelectedRegistrationId(e.target.value)}
              className="border border-gray-300 rounded p-2"
            >
              {registrations.map((reg) => (
                <option key={reg.Id} value={reg.Id}>
                  {reg.Name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product grid display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded shadow p-4"
            >
              <div className="w-full h-40 mb-2 relative">
                <Image
                  src={product.ProductPicture__c}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-2">{product.Description}</p>
              <p className="font-bold mb-4">
                Price: ${parseFloat(product.price || 0).toFixed(2)}
              </p>
              <button
                onClick={() => toggleSelectProduct(product)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {selectedProducts.find((p) => p.id === product.id)
                  ? "Remove"
                  : "Add"}
              </button>
            </div>
          ))}
        </div>

        {/* Summary and confirm section */}
        <div className="bg-white shadow p-4 rounded mt-6">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          <p className="mt-2 mb-4 text-gray-800">
            Total Charge: ${totalCharge.toFixed(2)}
          </p>
          <button
            disabled={loading || selectedProducts.length === 0}
            onClick={confirmPurchase}
            className={`px-4 py-2 rounded text-white ${
              loading || selectedProducts.length === 0
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Processing..." : "Confirm Purchase"}
          </button>

          {transactionRef && (
            <div className="mt-4 p-4 border border-green-400 bg-green-50 rounded">
              <h3 className="text-lg font-semibold">Transaction Successful!</h3>
              <p>Transaction Reference: {transactionRef}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
