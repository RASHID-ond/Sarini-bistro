import React from "react";
import { X, MapPin, Phone, Mail, User, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, CreditCard, ShoppingBag } from "lucide-react";
import { CartItem, Order } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  deliveryFee: number;
  onPlaceOrder: (orderData: any) => Promise<Order | null>;
  onInitiateMpesa: (orderId: string, phone: string, amount: number) => Promise<{ success: boolean; checkoutRequestId?: string; simulated?: boolean } | null>;
  onClearCart: () => void;
  onSetActiveOrder: (order: Order) => void;
  onSetTab: (tab: string) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  deliveryFee,
  onPlaceOrder,
  onInitiateMpesa,
  onClearCart,
  onSetActiveOrder,
  onSetTab,
}: CheckoutModalProps) {
  const [orderType, setOrderType] = React.useState<"pickup" | "delivery">("pickup");
  const [formData, setFormData] = React.useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    paymentMethod: "cash" as "cash" | "mpesa" | "card",
    paymentPhone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: ""
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Payment status polling states
  const [checkoutId, setCheckoutId] = React.useState<string | null>(null);
  const [isSimulated, setIsSimulated] = React.useState(false);
  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null);
  const [pollingStatus, setPollingStatus] = React.useState<"idle" | "polling" | "success" | "failed">("idle");

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const finalDeliveryFee = orderType === "delivery" ? deliveryFee : 0;
  const total = subtotal + finalDeliveryFee;

  // Poll M-Pesa payment status
  React.useEffect(() => {
    let timer: any;
    if (pollingStatus === "polling" && checkoutId) {
      const poll = async () => {
        try {
          const res = await fetch(`/api/payments/mpesa/status/${checkoutId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.paymentStatus === "paid") {
              setPollingStatus("success");
              if (createdOrder) {
                const updatedOrder = { ...createdOrder, paymentStatus: "paid" as const, orderStatus: "confirmed" as const };
                setCreatedOrder(updatedOrder);
                onSetActiveOrder(updatedOrder);
              }
            } else if (data.paymentStatus === "failed") {
              setPollingStatus("failed");
              setError("M-Pesa payment was declined or cancelled. Please try again.");
            }
          }
        } catch (err) {
          console.error("Error polling payment status", err);
        }
      };

      timer = setInterval(poll, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(timer);
  }, [pollingStatus, checkoutId, createdOrder, onSetActiveOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone) {
      setError("Please fill in your name and phone number.");
      return;
    }
    if (orderType === "delivery" && !formData.deliveryAddress) {
      setError("Please fill in your delivery address.");
      return;
    }
    if (formData.paymentMethod === "mpesa" && !formData.paymentPhone) {
      setError("Please provide an M-Pesa phone number for the STK push.");
      return;
    }
    if (formData.paymentMethod === "card" && (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv)) {
      setError("Please fill in all credit card details.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        orderType,
        deliveryAddress: orderType === "delivery" ? formData.deliveryAddress : undefined,
        items: cartItems.map(item => ({
          itemId: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity
        })),
        paymentMethod: formData.paymentMethod,
        paymentPhone: formData.paymentMethod === "mpesa" ? formData.paymentPhone : undefined
      };

      const order = await onPlaceOrder(payload);
      if (order) {
        setCreatedOrder(order);
        onSetActiveOrder(order);

        // If paying via M-Pesa, initiate the STK push
        if (formData.paymentMethod === "mpesa") {
          const mpesaRes = await onInitiateMpesa(order.id, formData.paymentPhone, order.total);
          if (mpesaRes && mpesaRes.success) {
            setCheckoutId(mpesaRes.checkoutRequestId || null);
            setIsSimulated(mpesaRes.simulated || false);
            setPollingStatus("polling");
          } else {
            setError("Failed to trigger M-Pesa STK Push. Try Cash on Delivery or double-check credentials.");
            setLoading(false);
          }
        } else if (formData.paymentMethod === "card") {
          // Simulate card payment processing
          setPollingStatus("polling");
          setTimeout(async () => {
            try {
              await fetch(`/api/orders/${order.id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentStatus: "paid", orderStatus: "confirmed" })
              });
              const updatedOrder = { ...order, paymentStatus: "paid" as const, orderStatus: "confirmed" as const };
              setCreatedOrder(updatedOrder);
              onSetActiveOrder(updatedOrder);
              setPollingStatus("success");
            } catch (err) {
              console.error(err);
              setPollingStatus("success");
            }
          }, 4000);
        } else {
          // Cash on delivery: complete checkout instantly
          onClearCart();
          onSetTab("track");
          onClose();
        }
      } else {
        setError("Could not submit order. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleCompletePollingFlow = () => {
    onClearCart();
    onSetTab("track");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="checkout-modal-overlay">
      {/* Backdrop */}
      <div 
        onClick={() => pollingStatus !== "polling" && onClose()} 
        className="fixed inset-0 bg-zinc-950/75 backdrop-blur-xs transition-opacity" 
      />

      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-zinc-850 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-850 bg-zinc-950 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-coral" />
            <h3 className="text-lg font-bold text-white">Secure Restaurant Checkout</h3>
          </div>
          {pollingStatus !== "polling" && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {pollingStatus === "polling" || pollingStatus === "success" || pollingStatus === "failed" ? (
          /* PAYMENT WAITING SCREEN */
          <div className="p-8 text-center space-y-6 flex-1 overflow-y-auto">
            {pollingStatus === "polling" && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
                  <div className="absolute inset-0 border-4 border-brand-coral border-t-transparent rounded-full animate-spin" />
                </div>
                
                {formData.paymentMethod === "mpesa" ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">Awaiting M-Pesa Payment</h4>
                      <p className="text-xs text-brand-coral font-bold uppercase tracking-wider font-mono">
                        Reference: #{createdOrder?.id}
                      </p>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        We sent an M-Pesa STK push (prompt) to <strong className="text-white font-mono">{formData.paymentPhone}</strong> for <strong>Ksh {total.toLocaleString()}</strong>.
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4.5 space-y-2 text-left text-xs text-zinc-300 leading-normal">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        How to pay:
                      </p>
                      <ul className="list-decimal list-inside space-y-1 text-zinc-400">
                        <li>Unlock your phone screen.</li>
                        <li>You will see an M-Pesa prompt requesting your PIN.</li>
                        <li>Enter your M-Pesa PIN and press OK.</li>
                        <li>Wait here. This page updates as soon as Safaricom responds.</li>
                      </ul>
                    </div>

                    {isSimulated && (
                      <div className="text-[11px] text-zinc-450 bg-brand-coral/5 border border-brand-coral/15 p-2.5 rounded-lg">
                        💡 <strong>Demo Mode:</strong> The sandbox simulator is active. It will auto-confirm this transaction as PAID after about 7 seconds. Enjoy the flow!
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white">Processing Card Payment</h4>
                    <p className="text-xs text-brand-coral font-bold uppercase tracking-wider font-mono">
                      Reference: #{createdOrder?.id}
                    </p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Securing transaction of <strong>Ksh {total.toLocaleString()}</strong> via our PCI-compliant gateway. Please do not refresh.
                    </p>
                  </div>
                )}
              </div>
            )}

            {pollingStatus === "success" && (
              <div className="space-y-5 max-w-md mx-auto">
                <div className="bg-emerald-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="text-2xl font-bold text-white">Payment Confirmed!</h4>
                  <p className="text-zinc-400 text-sm">
                    Thank you! We received your payment of Ksh {total.toLocaleString()} via {formData.paymentMethod === "mpesa" ? "M-Pesa" : "Credit/Debit Card"}. Your order <strong className="text-white">#{createdOrder?.id}</strong> is now confirmed.
                  </p>
                </div>

                <button
                  onClick={handleCompletePollingFlow}
                  className="w-full py-3.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                >
                  Track Order Real-Time
                </button>
              </div>
            )}

            {pollingStatus === "failed" && (
              <div className="space-y-5 max-w-md mx-auto">
                <div className="bg-red-950/40 border border-red-900/30 text-red-400 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Payment Cancelled</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    The M-Pesa push was declined or timed out. Please try checking out again or select Cash on Delivery.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setPollingStatus("idle");
                      setError("");
                      setLoading(false);
                    }}
                    className="flex-1 py-3 bg-zinc-850 text-white rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: "cash" });
                      setPollingStatus("idle");
                      setError("");
                      setLoading(false);
                    }}
                    className="flex-1 py-3 bg-brand-coral text-zinc-950 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-coral-hover transition-colors"
                  >
                    Use Cash
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MAIN CHECKOUT FORM */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
            <div className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="bg-red-950/30 border border-red-900/40 text-red-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Order Type Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider font-mono">Select Order Type</label>
                <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType("pickup");
                      setError("");
                    }}
                    className={`py-2 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer ${
                      orderType === "pickup"
                        ? "bg-zinc-900 text-white shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Pickup (Free)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType("delivery");
                      setError("");
                    }}
                    className={`py-2 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer ${
                      orderType === "delivery"
                        ? "bg-zinc-900 text-white shadow-md"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Delivery (+Ksh {deliveryFee.toLocaleString()})
                  </button>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
                  <User className="w-4.5 h-4.5 text-brand-coral" />
                  Recipient Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 block">Your Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 block">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 0708374149"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 block">Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="john.doe@gmail.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                    />
                  </div>
                </div>

                {/* Delivery Address (only if delivery chosen) */}
                {orderType === "delivery" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-250">
                    <label className="text-xs font-medium text-zinc-400 block">Delivery Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Apartment 4B, Kilimani Heights, Wood Avenue, Nairobi"
                        value={formData.deliveryAddress}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-sm border-b border-zinc-850 pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4.5 h-4.5 text-brand-coral" />
                  Choose Payment Method
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Cash */}
                  <div
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: "cash" });
                      setError("");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.paymentMethod === "cash"
                        ? "bg-brand-coral/10 border-brand-coral shadow-sm"
                        : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      formData.paymentMethod === "cash" ? "border-brand-coral" : "border-zinc-850"
                    }`}>
                      {formData.paymentMethod === "cash" && <div className="w-2.5 h-2.5 rounded-full bg-brand-coral" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block font-bold text-sm text-zinc-100">Cash / Pickup</span>
                      <span className="block text-zinc-404 text-[10px] leading-tight">Pay on arrival/courier.</span>
                    </div>
                  </div>

                  {/* M-Pesa */}
                  <div
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        paymentMethod: "mpesa",
                        paymentPhone: formData.paymentPhone || formData.customerPhone 
                      });
                      setError("");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.paymentMethod === "mpesa"
                        ? "bg-brand-coral/10 border-brand-coral shadow-sm"
                        : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      formData.paymentMethod === "mpesa" ? "border-brand-coral" : "border-zinc-850"
                    }`}>
                      {formData.paymentMethod === "mpesa" && <div className="w-2.5 h-2.5 rounded-full bg-brand-coral" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                        M-Pesa
                      </span>
                      <span className="block text-zinc-404 text-[10px] leading-tight">Secure phone prompt.</span>
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        paymentMethod: "card"
                      });
                      setError("");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.paymentMethod === "card"
                        ? "bg-brand-coral/10 border-brand-coral shadow-sm"
                        : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      formData.paymentMethod === "card" ? "border-brand-coral" : "border-zinc-850"
                    }`}>
                      {formData.paymentMethod === "card" && <div className="w-2.5 h-2.5 rounded-full bg-brand-coral" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="block font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                        Credit/Debit Card
                      </span>
                      <span className="block text-zinc-404 text-[10px] leading-tight">Visa, Mastercard, etc.</span>
                    </div>
                  </div>
                </div>

                {/* M-Pesa payment phone (only if Mpesa chosen) */}
                {formData.paymentMethod === "mpesa" && (
                  <div className="space-y-1.5 bg-zinc-950 border border-zinc-850 p-4.5 rounded-xl animate-in slide-in-from-top-4 duration-250">
                    <label className="text-xs font-bold text-brand-coral block uppercase tracking-wider font-mono">M-Pesa Phone for STK Push *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-coral" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 254708374149"
                        value={formData.paymentPhone}
                        onChange={(e) => setFormData({ ...formData, paymentPhone: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">
                      💡 Safaricom format: **254XXXXXXXXX** or standard local numbers like **07XXXXXXXX** or **01XXXXXXXX**.
                    </p>
                  </div>
                )}

                {/* Card Fields (only if Card chosen) */}
                {formData.paymentMethod === "card" && (
                  <div className="space-y-3 bg-zinc-950 border border-zinc-850 p-4.5 rounded-xl animate-in slide-in-from-top-4 duration-250">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-coral block uppercase tracking-wider font-mono">Card Number *</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 block">Expiry Date *</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={formData.cardExpiry}
                          onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 block">CVV *</label>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          maxLength={3}
                          value={formData.cardCvv}
                          onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/25"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky summary and action footer */}
            <div className="border-t border-zinc-850 p-6 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-center sm:text-left">
                <span className="block text-zinc-400 text-xs">Total payment requested:</span>
                <span className="font-extrabold text-brand-coral text-lg font-mono">
                  Ksh {total.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-8 py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-102 active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      Place Secure Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
