import { X, Trash2, Plus, Minus, ShoppingBag, ShoppingCart } from "lucide-react";
import { CartItem, MenuItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onProceedToCheckout: () => void;
  deliveryFee: number;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  deliveryFee,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="shopping-cart-drawer">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-zinc-900 shadow-2xl flex flex-col h-full border-l border-zinc-850 text-white animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-850 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2 text-white">
              <ShoppingBag className="w-5 h-5 text-brand-coral" />
              <h2 className="text-lg font-bold">Your Feast Basket</h2>
              <span className="bg-brand-coral/10 text-brand-coral border border-brand-coral/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {cartItems.reduce((count, item) => count + item.quantity, 0)}
              </span>
            </div>
            <button
              id="close-cart-button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-850">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex gap-4 p-3 rounded-xl border border-zinc-850 hover:border-zinc-800 transition-all shadow-lg bg-zinc-950 group"
                >
                  <img
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    className="w-16 h-16 object-cover rounded-lg border border-zinc-800 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm truncate pr-2 group-hover:text-brand-coral transition-colors">
                          {item.menuItem.name}
                        </h4>
                        <span className="font-bold text-white text-sm shrink-0">
                          Ksh {(item.menuItem.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[11px] truncate mt-0.5 font-mono">
                        Ksh {item.menuItem.price.toLocaleString()} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-950 rounded transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-950 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => onRemoveItem(item.menuItem.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 space-y-4">
                <div className="p-4 bg-zinc-950 text-zinc-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto border border-zinc-850">
                  <ShoppingCart className="w-6 h-6 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-white">Your Basket is Empty</p>
                  <p className="text-zinc-400 text-xs max-w-xs mx-auto">
                    Browse our delicacies and add mouth-watering starters, mains, or drinks to your cart.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  Browse Menu
                </button>
              </div>
            )}
          </div>

          {/* Checkout Footer Block */}
          {cartItems.length > 0 && (
            <div className="border-t border-zinc-850 p-6 bg-zinc-950 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Basket Subtotal:</span>
                  <span className="font-semibold text-white">Ksh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Standard Delivery:</span>
                  <span className="font-semibold text-zinc-300">
                    Toggled at Checkout
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-zinc-850 pt-2.5 text-sm">
                  <span>Total Amount:</span>
                  <span className="text-brand-coral text-base font-extrabold font-mono">
                    Ksh {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                id="checkout-proceed-button"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Proceed to Checkout
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
