import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { CreditCard, Smartphone, Building2, Wallet, X, Lock, Check } from "lucide-react";

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard },
  { id: "upi", name: "UPI", icon: Smartphone },
  { id: "netbanking", name: "Net Banking", icon: Building2 },
  { id: "wallet", name: "Wallet", icon: Wallet },
];

export default function CheckoutModal({ event, orderId, amount, onClose, onSuccess }) {
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [upiId, setUpiId] = useState("");

  const handlePay = async () => {
    // Basic validation
    if (method === "card") {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        return toast.error("Please fill in all card details");
      }
    }
    if (method === "upi" && !upiId) {
      return toast.error("Please enter your UPI ID");
    }

    setProcessing(true);
    try {
      const res = await api.post("/payments/verify", {
        orderId,
        paymentMethod: method,
        cardLast4: cardForm.number.slice(-4) || "4242",
        cardBrand: cardForm.number.startsWith("4") ? "Visa" : cardForm.number.startsWith("5") ? "Mastercard" : "Card",
        upiId: upiId || "",
      });

      setSuccess(true);
      toast.success("Payment successful!");

      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess(res.data);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
            <p className="text-sm text-gray-500">{event?.title}</p>
          </div>
          <button onClick={onClose} disabled={processing} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-500">Your registration is confirmed.</p>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount to pay</span>
                <span className="text-2xl font-bold text-gray-900">₹{amount}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="px-6 py-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setMethod(pm.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                        method === pm.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {pm.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Form */}
            {method === "card" && (
              <div className="px-6 pb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={cardForm.number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardForm({ ...cardForm, number: val });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                      setCardForm({ ...cardForm, expiry: val });
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.slice(0, 3) })}
                    maxLength={3}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400">Demo: Use any 16 digits, any expiry, any CVV</p>
              </div>
            )}

            {/* UPI Form */}
            {method === "upi" && (
              <div className="px-6 pb-4">
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g., name@upi)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Demo: Use any UPI ID format</p>
              </div>
            )}

            {/* Net Banking / Wallet placeholder */}
            {(method === "netbanking" || method === "wallet") && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                  {method === "netbanking" ? "Select your bank and proceed" : "Select your wallet"}
                  — Click Pay to simulate
                </p>
              </div>
            )}

            {/* Pay Button */}
            <div className="px-6 pb-6">
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                {processing ? "Processing..." : `Pay ₹${amount}`}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Secured with 256-bit encryption
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
