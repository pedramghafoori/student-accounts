"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Image from "next/image";

function AddOnsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const enrollmentId = searchParams.get("enrollmentId");
  console.log("[AddOnProductsPage] enrollmentId from URL:", enrollmentId);

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalCharge, setTotalCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transactionRef, setTransactionRef] = useState(null);
  const [error, setError] = useState(null);
  const [required, setRequired] = useState([]);
  const [optional, setOptional] = useState([]);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    console.log("[AddOnProductsPage] Attempting to fetch add-ons by enrollmentId:", enrollmentId);
    if (!enrollmentId) {
      console.log("[AddOnProductsPage] No enrollmentId in URL, skipping fetch");
      return;
    }

    const fetchData = async () => {
      try {
        console.log("[AddOnProductsPage] Fetching /api/addons?enrollmentId=", enrollmentId);
        const res = await fetch(`/api/addons?enrollmentId=${enrollmentId}`);
        const data = await res.json();
        console.log("[AddOnProductsPage] /api/addons response:", data);

        if (!data.success) {
          setError(data.message || "Failed to load.");
          return;
        }

        if (data.product2Record && data.product2Record.Name) {
          console.log("[AddOnProductsPage] Setting courseName from product2Record:", data.product2Record.Name);
          setCourseName(data.product2Record.Name);
        }

        console.log("[AddOnProductsPage] raw products from server:", data.products);
        const allProducts = data.products || [];
        console.log("[AddOnProductsPage] allProducts:", allProducts);

        // 1) Right after we get "allProducts", map them to ensure they have isRequired/isOptional:
        console.log("[AddOnProductsPage] All products before setting flags:", allProducts);

        const processed = allProducts.map((p) => {
          // Log the product as we process it
          console.log("[AddOnProductsPage] Before flags =>", p);
          // If backend didn't send isRequired/isOptional, derive from Family or something else
          const hasNoFlags = (p.isRequired === undefined && p.isOptional === undefined);
          if (hasNoFlags) {
            // Example logic: treat 'Reference' as required, 'Resale Products' as optional
            const isRef = p.Family === "Reference";
            const isResale = p.Family === "Resale Products";
            return {
              ...p,
              isRequired: isRef,
              isOptional: isResale,
            };
          }
          return p; // If flags exist, preserve them
        });

        console.log("[AddOnProductsPage] after adding flags:", processed);

        const requiredProducts = processed.filter((p) => p.isRequired);
        const optionalProducts = processed.filter((p) => p.isOptional);

        // 2) Log them out
        console.log("[AddOnProductsPage] requiredProducts =>", requiredProducts);
        console.log("[AddOnProductsPage] optionalProducts =>", optionalProducts);

        setRequired(requiredProducts);
        setOptional(optionalProducts);
        console.log("[AddOnProductsPage] setProducts with:", data.products);
      } catch (err) {
        console.log("[AddOnProductsPage] Error fetching add-ons:", err);
        setError(err.message);
      }
    };

    fetchData();
  }, [enrollmentId]);

  const toggleSelectProduct = (product) => {
    console.log("[AddOnProductsPage] toggleSelectProduct for:", product.Id);
    if (product.alreadyPurchased) {
      console.log("[AddOnProductsPage] Product already purchased. Skipping.");
      return;
    }

    let updated;
    if (selectedProducts.some((p) => p.Id === product.Id)) {
      updated = selectedProducts.filter((p) => p.Id !== product.Id);
      console.log("[AddOnProductsPage] Removed product from cart:", product.Id);
    } else {
      updated = [...selectedProducts, product];
      console.log("[AddOnProductsPage] Added product to cart:", product.Id);
    }
    setSelectedProducts(updated);

    const total = updated.reduce((sum, prod) => {
      return sum + parseFloat(prod.UnitPrice || 0);
    }, 0);
    setTotalCharge(total);
    console.log("[AddOnProductsPage] Updated totalCharge:", total);
  };

  const confirmPurchase = async () => {
    console.log("[AddOnProductsPage] confirmPurchase with selected:", selectedProducts);
    if (selectedProducts.length === 0) {
      console.log("[AddOnProductsPage] No products selected. Aborting.");
      return;
    }
    setLoading(true);
    setError(null);

    const productIds = selectedProducts.map((p) => p.Id).join(",");
    console.log("[AddOnProductsPage] Building flow payload with productIds:", productIds);

    const payload = {
      Opportunity_Id_Input: "someOppId",
      Comma_Separated_Product_Ids_Input: productIds,
      Total_Add_On_Amount: totalCharge,
    };

    try {
      console.log("[AddOnProductsPage] POST /api/invoke-flow with payload:", payload);
      const res = await fetch("/api/invoke-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      console.log("[AddOnProductsPage] /api/invoke-flow response:", json);

      if (json.success) {
        setTransactionRef(json.transactionReference);
      } else {
        setError(json.message || "Flow invocation failed");
      }
    } catch (err) {
      console.log("[AddOnProductsPage] Error in confirmPurchase:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Header
        headerTagline="Course Materials"
        selectedAccount={null}
        accounts={[]}
        showAccountDropdown={false}
        setShowAccountDropdown={() => {}}
        handleSelect={() => {}}
        handleLogout={() => router.push("/login")}
        courseName={courseName}
        showBackButton={true}
      />

      <div className="p-6">
        {error && <div className="text-red-600 mb-4">Error: {error}</div>}

        <div className="bg-white shadow p-2 rounded mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Summary:</h2>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {selectedProducts.map((product) => (
                <div key={product.Id} className="flex items-center mb-1">
                  <span className="text-sm">{product.Name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {parseFloat(product.UnitPrice || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center ml-4">
              <button
                disabled={loading || selectedProducts.length === 0}
                onClick={confirmPurchase}
                className={`px-4 py-2 rounded text-white ${
                  loading || selectedProducts.length === 0
                    ? "bg-gray-400"
                    : "bg-[#1f2937] hover:bg-[#111827]"
                }`}
              >
                {loading ? "Processing..." : "Reserve Material"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                total: {parseFloat(totalCharge || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...required, ...optional].map((product) => {
            const isInCart = selectedProducts.some((p) => p.Id === product.Id);
            const isRequired = required.some((p) => p.Id === product.Id);
            
            return (
              <div key={product.Id} className="bg-white border border-gray-200 rounded shadow p-4 flex flex-col h-full">
                <div className="w-full mb-3">
                  <Image
                    src={product.ProductPicture__c || "/placeholder.png"}
                    alt={product.Name}
                    width={200}
                    height={150}
                    style={{ objectFit: "contain" }}
                    className="w-full h-32 sm:h-auto"
                  />
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">{product.Name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isRequired 
                      ? "border border-red-500 text-red-500" 
                      : "border border-green-600 text-green-600"
                  }`}>
                    {isRequired ? "Required" : "Optional"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 flex-grow">{product.Description}</p>

                {product.alreadyPurchased ? (
                  <p className="text-green-600 font-bold">Already Purchased</p>
                ) : (
                  <div className="mt-auto">
                    <p className="text-sm text-gray-500 mb-3">
                      {parseFloat(product.UnitPrice || 0).toFixed(2)}
                    </p>
                    <button
                      onClick={() => toggleSelectProduct(product)}
                      className={`w-full px-4 py-2 rounded text-white ${
                        isInCart
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {isInCart ? "Remove" : "Add"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {transactionRef && (
          <div className="mt-4 p-4 border border-green-400 bg-green-50 rounded">
            <h3 className="text-lg font-semibold">Transaction Successful!</h3>
            <p>Transaction Reference: {transactionRef}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default function AddOnProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddOnsContent />
    </Suspense>
  );
}