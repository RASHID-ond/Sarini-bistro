import React from "react";
import { ShoppingCart, Calendar, Clock, Star, MapPin, Sparkles, ShieldCheck, Phone } from "lucide-react";

import { RestaurantSettings } from "../types";

interface HeroProps {
  onOrderClick: () => void;
  onReserveClick: () => void;
  settings: RestaurantSettings;
}

export default function Hero({ onOrderClick, onReserveClick, settings }: HeroProps) {
  const handleCall = () => {
    window.location.href = `tel:${settings.phone}`;
  };

  const getImg = (id: string, defaultSrc: string) => {
    if (settings && settings.websiteImages) {
      const found = settings.websiteImages.find((img) => img.id === id);
      if (found && found.src) return found.src;
    }
    return defaultSrc;
  };

  const getImgName = (id: string, defaultName: string) => {
    if (settings && settings.websiteImages) {
      const found = settings.websiteImages.find((img) => img.id === id);
      if (found && found.name) return found.name;
    }
    return defaultName;
  };

  const headline = settings.heroHeadline || "Authentic Kenyan Flavors on the A1 Highway in Kitale";
  const subtitle = settings.heroSubtitle || "Savor the finest slow-roasted Mbuzi Choma, spicy Chips Masala, and hot flame-grilled meats. A perfect traveler's stopover!";
  const heroImgUrl = settings.heroImage || "";
  const heroBackgroundUrl = settings.heroBackgroundImage || "";
  const [heroBgLoaded, setHeroBgLoaded] = React.useState(false);
  const operatingHrsText = settings.operatingHours || "6:30 AM – 8:30 PM";
  const operatingDaysText = settings.operatingDays || "Open 7 Days a Week";

  return (
    <div className="relative isolate overflow-hidden bg-[#0B0B0D] text-white pt-16 pb-32 bg-noise">
      {/* Background radial glowing effects matching mockup atmospheric lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] glow-pink-radial -z-10 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] glow-peach-radial -z-10 pointer-events-none animate-pulse" style={{ animationDuration: '14s' }} />
      
      {/* Curved gradient waves at lower left and lower right corners */}
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 curved-wave-left -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 curved-wave-right -z-10 pointer-events-none" />

      {/* Floating Decorative Ingredients with float animations exactly like mockup */}
      {/* Top Left Tomato */}
      {getImg("tomato-left", "") && (
        <div className="absolute top-24 left-[12%] w-20 h-20 md:w-28 md:h-28 opacity-80 pointer-events-none animate-float-slow">
          <img 
            src={getImg("tomato-left", "")} 
            alt={getImgName("tomato-left", "Tomato Slice")} 
            className="w-full h-full object-contain rotate-[15deg] select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      {/* Top Right Tomato */}
      {getImg("tomato-right", "") && (
        <div className="absolute top-20 right-[14%] w-20 h-20 md:w-28 md:h-28 opacity-85 pointer-events-none animate-float-reverse">
          <img 
            src={getImg("tomato-right", "")} 
            alt={getImgName("tomato-right", "Tomato Slice")} 
            className="w-full h-full object-contain rotate-[-35deg] select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      {/* Left Basil Leaf */}
      {getImg("basil-left", "") && (
        <div className="absolute bottom-1/3 left-[15%] w-14 h-14 md:w-20 md:h-20 opacity-70 pointer-events-none animate-float-reverse">
          <img 
            src={getImg("basil-left", "")} 
            alt={getImgName("basil-left", "Basil Leaf")} 
            className="w-full h-full object-contain rotate-[45deg] select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      {/* Right Basil Leaf */}
      {getImg("basil-right", "") && (
        <div className="absolute bottom-1/4 right-[15%] w-14 h-14 md:w-20 md:h-20 opacity-75 pointer-events-none animate-float-slow">
          <img 
            src={getImg("basil-right", "")} 
            alt={getImgName("basil-right", "Basil Leaf")} 
            className="w-full h-full object-contain rotate-[-25deg] select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      )}


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        
        <div className="relative isolate">
          {heroBackgroundUrl && (
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-[32px] pointer-events-none">
              <img
                src={heroBackgroundUrl}
                alt=""
                onLoad={() => setHeroBgLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-[1400ms] ease-out ${heroBgLoaded ? "opacity-100" : "opacity-0"}`}
                referrerPolicy="no-referrer"
              />
              {/* Soft scrim for text contrast, using the theme-aware blend color */}
              <div className="absolute inset-0" style={{ background: "var(--hero-scrim)" }} />
              {/* Edge fades so the image blends into the page rather than showing hard edges */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, var(--hero-blend-bg) 0%, transparent 2.5%, transparent 96%, var(--hero-blend-bg) 100%), " +
                    "linear-gradient(to right, var(--hero-blend-bg) 0%, transparent 2%, transparent 98%, var(--hero-blend-bg) 100%)"
                }}
              />
            </div>
          )}

          <div className="py-8 px-4 sm:px-8">
            {settings.logoUrl && (
              <div className="flex justify-center mb-2 animate-bounce-slow">
                <img 
                  src={settings.logoUrl} 
                  alt={`${settings.restaurantName} Logo`} 
                  className="h-20 w-20 object-contain rounded-full border border-brand-coral/20 p-1 bg-zinc-950 shadow-xl" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Sarini Bistro Main Responsive Headline */}
            <div className="max-w-[720px] mx-auto space-y-5">
              <h1
                className="text-4xl sm:text-5xl lg:text-[60px] font-black tracking-tight text-[#F5F5F7] leading-[1.1] font-sans"
                style={heroBackgroundUrl ? { textShadow: "0 2px 16px rgba(0,0,0,0.5)" } : undefined}
              >
                {headline}
              </h1>
              
              <p
                className="text-xs sm:text-sm text-[#A8A8B3] max-w-2xl mx-auto leading-relaxed tracking-wide font-medium"
                style={heroBackgroundUrl ? { textShadow: "0 1px 10px rgba(0,0,0,0.5)" } : undefined}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Elegant Action Buttons matching specifications */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 max-w-2xl mx-auto">
          <button
            onClick={onOrderClick}
            className="px-7 py-3.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 font-black text-xs uppercase tracking-widest rounded-[16px] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-[0_4px_25px_rgba(243,169,181,0.25)] flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Order Now
          </button>
          
          <button
            onClick={onReserveClick}
            className="px-7 py-3.5 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 text-white font-black text-xs uppercase tracking-widest rounded-[16px] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-brand-coral" />
            Make a Reservation
          </button>

          <button
            onClick={handleCall}
            className="px-7 py-3.5 bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 text-white font-black text-xs uppercase tracking-widest rounded-[16px] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-brand-coral" />
            Call {settings.phone}
          </button>
        </div>

        {/* Feature Metadata Row (Open 6:30 AM – 8:30 PM • Quick Service • A1 Kitale) */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 text-[11px] text-[#A8A8B3] font-bold">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-coral" />
            <span>{settings.address.split(",")[0] || "Kitale"}</span>
          </div>
          <span className="text-zinc-800 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-coral" />
            <span>Quick Service</span>
          </div>
          <span className="text-zinc-800 hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-coral" />
            <span>{operatingHrsText} ({operatingDaysText})</span>
          </div>
        </div>

        {/* Central Food Plate with Concave Arch Backdrop Section exactly matching mockup */}
        <div className="relative mx-auto max-w-xl flex justify-center pt-24 select-none">
          {/* Real solid concave background arch swoop divider */}
          <div className="absolute bottom-[-135px] left-1/2 -translate-x-1/2 w-[220%] aspect-[2/1] rounded-t-[50%] bg-[#0B0B0D] border-t border-zinc-900/60 -z-10 pointer-events-none shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)]" />

          {/* Luxury frame border wrapping the food plate with soft ambient shadow */}
          <div className="relative group p-4 sm:p-5 rounded-full bg-zinc-950/40 border border-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-coral/10 to-transparent rounded-full blur-xl pointer-events-none animate-pulse" />
            {heroImgUrl && (
              <img
                src={heroImgUrl}
                alt={`${settings.restaurantName} Featured Dish`}
                className="w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] object-cover rounded-full shadow-inner border border-zinc-800/40 transition-transform duration-700 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
