"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState, Suspense } from "react";
import { createPayment, type PaymentData } from "@/utils/paymentApi";
import { api } from "@/utils/apiClient";

// ─── Types ──────────────────────────────────────────────────────
type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "digital_wallet";
type PaymentStep = "form" | "processing" | "success" | "failed";
type PaymentApiError = {
  data?: {
    data?: PaymentData;
    error?: string;
  };
  message?: string;
};

// ─── Inner Component (uses useSearchParams) ─────────────────────
function PaymentPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();

  const eventId = params?.id as string;

  // Query params from event detail page
  const ticketPrice = searchParams.get("price") || "0";
  const ticketName = searchParams.get("ticketName") || "Standard";
  const ticketTypeId = searchParams.get("ticketTypeId") || "";

  // Event data from backend
  const [eventName, setEventName] = useState<string>("");
  const [eventImage, setEventImage] = useState<string>("");
  const [eventVenue, setEventVenue] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  // Bank transfer fields
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Digital wallet fields
  const [walletProvider, setWalletProvider] = useState("");
  const [walletId, setWalletId] = useState("");

  // Flow state
  const [step, setStep] = useState<PaymentStep>("form");
  const [paymentResult, setPaymentResult] = useState<PaymentData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  // ─── Load event details ───────────────────────────────────────
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoadingEvent(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || '/api'}/events/${eventId}`
        );
        if (res.ok) {
          const data = await res.json();
          const e = data.event;
          setEventName(e.title || e.name || "Event");
          setEventImage(e.image_url || "");
          setEventVenue(e.venue || "");
          setEventDate(e.event_date || "");
        }
      } catch {
        /* Silently fallback */
      } finally {
        setLoadingEvent(false);
      }
    };
    if (eventId) loadEvent();
  }, [eventId]);

  // ─── Card number formatting ───────────────────────────────────
  const formatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  // ─── Submit payment ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.backendToken) {
      setErrorMessage("You must be logged in to make a payment.");
      return;
    }

    // Validate card fields for card payment methods
    const isCard = paymentMethod === "credit_card" || paymentMethod === "debit_card";
    if (isCard) {
      const rawCard = cardNumber.replace(/\s/g, "");
      if (rawCard.length < 16) {
        setErrorMessage("Please enter a valid 16-digit card number.");
        return;
      }
      if (expiry.length < 5) {
        setErrorMessage("Please enter a valid expiration date (MM/YY).");
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage("Please enter a valid CVV (3-4 digits).");
        return;
      }
      if (!nameOnCard.trim()) {
        setErrorMessage("Please enter the name on card.");
        return;
      }
    }

    // Validate bank transfer fields
    if (paymentMethod === "bank_transfer") {
      if (!bankName) {
        setErrorMessage("Please select your bank.");
        return;
      }
      if (accountNumber.length < 8) {
        setErrorMessage("Please enter a valid account number.");
        return;
      }
      if (!accountHolder.trim()) {
        setErrorMessage("Please enter the account holder name.");
        return;
      }
    }

    // Validate digital wallet fields
    if (paymentMethod === "digital_wallet") {
      if (!walletProvider) {
        setErrorMessage("Please select a wallet provider.");
        return;
      }
      if (!walletId.trim()) {
        setErrorMessage("Please enter your wallet ID or phone number.");
        return;
      }
    }

    setStep("processing");
    setErrorMessage("");

    try {
      const userId = session?.user?.id;
      if (!userId || userId.trim() === "") {
        throw new Error("User ID is missing. Please sign in again.");
      }

      const reserveResult = await api.post(
        "/bookings/reserve",
        {
          userId,
          items: [
            {
              eventId: Number(eventId),
              ticketTypeId: Number(ticketTypeId),
              ticketName,
              quantity: 1,
              unitPrice: parseFloat(ticketPrice),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${session.backendToken}`,
          },
        }
      );

      const reservedBookingId = String(reserveResult?.data?.id || "");
      if (!reservedBookingId) {
        throw new Error("Failed to create booking reservation.");
      }

      setBookingId(reservedBookingId);
      const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);

      const result = await createPayment(session.backendToken, {
        bookingId: reservedBookingId,
        amount: parseFloat(ticketPrice),
        currency: "LKR",
        paymentMethod,
        cardLast4: isCard ? cardLast4 : undefined,
        metadata: {
          eventId,
          eventName,
          ticketTypeId,
          ticketName,
        },
      });

      setPaymentResult(result.data);
      setStep(result.data.status === "completed" ? "success" : "failed");
      if (result.data.status === "failed") {
        setErrorMessage(result.data.failureReason || "Payment was declined.");
      }
    } catch (err: unknown) {
      const paymentError = err as PaymentApiError;
      // Extract payment data from failed API response (e.g. card declined - 400)
      if (paymentError?.data?.data) {
        setPaymentResult(paymentError.data.data);
      }
      setStep("failed");
      setErrorMessage(
        paymentError?.data?.error || paymentError?.message || "Payment processing failed. Please try again."
      );
    }
  };

  // ─── Loading ──────────────────────────────────────────────────
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // ─── Auth gate ────────────────────────────────────────────────
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Login Required</h2>
          <p className="text-sm text-gray-600 mb-6">Please sign in to proceed with your payment.</p>
          <Link
            href="/login"
            className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ─── Processing State ─────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-sm text-gray-600">Please wait while we process your transaction...</p>
        </div>
      </div>
    );
  }

  // ─── Success State ────────────────────────────────────────────
  if (step === "success" && paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
          <p className="text-sm text-gray-600 mb-6">Your ticket has been confirmed.</p>

          {/* Transaction details */}
          <div className="bg-gray-50 rounded-lg p-5 text-left space-y-3 mb-6 border border-gray-200">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Event</span>
              <span className="text-sm font-medium text-gray-800">{eventName || `Event #${eventId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Ticket</span>
              <span className="text-sm font-medium text-gray-800">{ticketName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-sm font-bold text-green-700">Rs. {parseFloat(String(paymentResult.amount)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Transaction ID</span>
              <span className="text-sm font-mono text-gray-700">{paymentResult.transactionId?.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Completed
              </span>
            </div>
            {bookingId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Booking ID</span>
                <span className="text-sm font-medium text-gray-800">BKG-{bookingId}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Link
              href="/payments"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
            >
              View Payments
            </Link>
            <Link
              href="/events"
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-center"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Failed State ─────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Failed</h2>
          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>

          {paymentResult && (
            <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Payment ID</span>
                <span className="text-sm font-mono text-gray-700">{paymentResult.id.slice(0, 16)}...</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("form"); setErrorMessage(""); }}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/events"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Payment Form ─────────────────────────────────────────────
  const isCardMethod = paymentMethod === "credit_card" || paymentMethod === "debit_card";

  return (
    <div className="bg-white text-gray-900">
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <Link
          href={`/events/${eventId}`}
          className="text-gray-600 hover:text-gray-900 font-medium transition duration-300"
        >
          ← Back to Event
        </Link>
      </div>

      <section className="px-6 pb-20 max-w-4xl mx-auto">
        {/* Event Image */}
        <div className="mb-8">
          {loadingEvent ? (
            <div className="w-full h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : eventImage ? (
            <img
              src={eventImage}
              alt={eventName}
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-4xl">🎫</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT: Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Event</p>
                  <p className="font-medium text-gray-800">{eventName || `Event #${eventId}`}</p>
                </div>
                {eventVenue && (
                  <div>
                    <p className="text-gray-500">📍 Venue</p>
                    <p className="font-medium text-gray-800">{eventVenue}</p>
                  </div>
                )}
                {eventDate && (
                  <div>
                    <p className="text-gray-500">📅 Date</p>
                    <p className="font-medium text-gray-800">{new Date(eventDate).toDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Ticket Type</p>
                  <p className="font-medium text-gray-800">{ticketName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium text-gray-800">1</p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs. {parseFloat(ticketPrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">Payment Information</h2>
              <p className="text-sm text-gray-600 mb-8">Complete your purchase securely</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "credit_card", label: "Credit Card", icon: "💳" },
                      { value: "debit_card", label: "Debit Card", icon: "💳" },
                      { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                      { value: "digital_wallet", label: "Digital Wallet", icon: "📱" },
                    ] as const).map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-3 rounded-lg border text-left text-sm font-medium transition duration-300 flex items-center gap-2 ${
                          paymentMethod === method.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Fields */}
                {isCardMethod && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <span className="text-green-500 text-lg">💳</span>
                      <p className="text-sm text-green-700">Enter your {paymentMethod === "credit_card" ? "credit" : "debit"} card details below. Your card information is encrypted and secure.</p>
                    </div>

                    {/* Visual Card Preview */}
                    <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-700 rounded-xl p-6 text-white shadow-lg overflow-hidden">
                      {/* Background pattern */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                      <div className="relative">
                        {/* Card type badge */}
                        <div className="flex justify-between items-start mb-8">
                          <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded">
                            {paymentMethod === "credit_card" ? "CREDIT" : "DEBIT"}
                          </span>
                          <span className="text-lg font-bold tracking-wider">
                            {cardNumber.startsWith("4") ? "VISA" :
                             cardNumber.startsWith("5") ? "MasterCard" :
                             cardNumber.startsWith("3") ? "AMEX" : "CARD"}
                          </span>
                        </div>

                        {/* Card number display */}
                        <p className="text-xl font-mono tracking-[0.2em] mb-6">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </p>

                        {/* Card holder & expiry */}
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Card Holder</p>
                            <p className="text-sm font-medium tracking-wide">{nameOnCard || "YOUR NAME"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Expires</p>
                            <p className="text-sm font-mono">{expiry || "MM/YY"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="cardNumber"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black pr-20"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${cardNumber.startsWith("4") ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>VISA</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${cardNumber.startsWith("5") ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>MC</span>
                        </div>
                      </div>
                    </div>

                    {/* Name on Card */}
                    <div>
                      <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        id="nameOnCard"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                        placeholder="Full name as on card"
                        required
                      />
                    </div>

                    {/* Expiry & CVV side by side */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          id="expirationDate"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                          placeholder="MM/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            id="cvv"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                            placeholder="•••"
                            maxLength={4}
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔒</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">3 or 4 digits on the back of your card</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Fields */}
                {paymentMethod === "bank_transfer" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <span className="text-blue-500 text-lg">🏦</span>
                      <p className="text-sm text-blue-700">Enter your bank details below. The amount will be debited securely from your account.</p>
                    </div>

                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <select
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black bg-white"
                        required
                      >
                        <option value="">Select your bank</option>
                        <option value="BOC">Bank of Ceylon</option>
                        <option value="PB">People&apos;s Bank</option>
                        <option value="COM">Commercial Bank</option>
                        <option value="HNB">Hatton National Bank</option>
                        <option value="SAM">Sampath Bank</option>
                        <option value="NDB">NDB Bank</option>
                        <option value="NSB">National Savings Bank</option>
                        <option value="DFCC">DFCC Bank</option>
                        <option value="SEY">Seylan Bank</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                        placeholder="Enter your account number"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        id="accountHolder"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                        placeholder="Full name as on bank account"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Digital Wallet Fields */}
                {paymentMethod === "digital_wallet" && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                      <span className="text-purple-500 text-lg">📱</span>
                      <p className="text-sm text-purple-700">Select your wallet provider and enter your wallet ID to authorize this payment.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Wallet Provider</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "frimi", label: "FriMi", icon: "💳" },
                          { value: "genie", label: "Genie", icon: "🧞" },
                          { value: "payhere", label: "PayHere", icon: "💰" },
                          { value: "kpay", label: "K Pay", icon: "📲" },
                          { value: "ipay", label: "iPay", icon: "📱" },
                          { value: "other", label: "Other", icon: "🔗" },
                        ].map((w) => (
                          <button
                            key={w.value}
                            type="button"
                            onClick={() => setWalletProvider(w.value)}
                            className={`p-3 rounded-lg border text-center text-sm font-medium transition duration-300 ${
                              walletProvider === w.value
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            <span className="text-lg block mb-1">{w.icon}</span>
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="walletId" className="block text-sm font-medium text-gray-700 mb-2">Wallet ID / Phone Number</label>
                      <input
                        type="text"
                        id="walletId"
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-black"
                        placeholder="e.g. 07X XXXX XXX or wallet@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errorMessage && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition duration-300 transform hover:scale-[1.02]"
                >
                  Pay Rs. {parseFloat(ticketPrice).toFixed(2)}
                </button>

                {/* Security badge */}
                <p className="text-center text-xs text-gray-500">
                  🔒 Secured with 256-bit SSL encryption
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main Page (wrapped in Suspense for useSearchParams) ────────
export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <PaymentPageInner />
    </Suspense>
  );
}