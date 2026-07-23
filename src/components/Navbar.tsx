import React from "react";
import { ShoppingCart, Calendar, Clock, ClipboardList, UtensilsCrossed, Sun, Moon } from "lucide-react";

import { RestaurantSettings } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  settings: RestaurantSettings;
  theme: string;
  toggleTheme: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  settings,
  theme,
  toggleTheme,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "menu", label: "Menu" },
    { id: "reserve", label: "Reservations" },
    { id: "contact", label: "Contact Us" },
    { id: "track", label: "Track Order" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#0B0B0D]/95 backdrop-blur-md border-b border-zinc-900/60 text-white bg-noise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo / Branding */}
          <div 
            onClick={() => setActiveTab("home")} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group animate-none"
          >
            {settings.logoUrl && (
              <img 
                src={settings.logoUrl} 
                alt={`${settings.restaurantName} Logo`} 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg border border-white/10 p-0.5 bg-zinc-950" 
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-lg sm:text-2xl font-black tracking-tight text-white font-sans group-hover:text-brand-coral transition-colors">
              {settings.restaurantName}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-1 py-1 text-xs font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? "text-brand-coral font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-coral" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action & Cart Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("menu")}
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-[16px] transition-all active:scale-95 shadow-[0_4px_20px_rgba(243,169,181,0.25)] cursor-pointer"
            >
              Order Now
            </button>

            <button
              id="theme-toggle-button"
              onClick={toggleTheme}
              className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 rounded-[16px] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-lg text-white"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <button
              id="cart-trigger-button"
              onClick={onOpenCart}
              className="relative p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 rounded-[16px] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-lg"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#10B981] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold border border-zinc-950 shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B0B0D] border-t border-zinc-900/60 px-4 py-3 space-y-1.5 shadow-xl bg-noise">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-[16px] text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-900/60 text-brand-coral"
                    : "text-zinc-300 hover:bg-zinc-900/40 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-coral" />}
              </button>
            );
          })}
          
          <button
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-[16px] text-left text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-zinc-300 hover:bg-zinc-900/40 hover:text-white"
          >
            <span>Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
          </button>

          <div className="pt-2 px-4">
            <button
              onClick={() => {
                setActiveTab("menu");
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-extrabold text-xs uppercase tracking-wider rounded-[16px] text-center shadow-lg cursor-pointer"
            >
              Order Online Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
