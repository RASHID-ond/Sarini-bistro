import React from "react";
import { Search, Plus, Check, ShoppingCart, Sparkles, FilterX, UtensilsCrossed } from "lucide-react";
import { MenuItem } from "../types";

interface MenuSectionProps {
  menuItems: MenuItem[];
  categories: string[];
  onAddToCart: (item: MenuItem) => void;
  cartQuantities: { [itemId: string]: number };
}

export default function MenuSection({
  menuItems,
  categories,
  onAddToCart,
  cartQuantities,
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>(" ");

  // Initializing to empty string on load safely
  React.useEffect(() => {
    setSearchQuery("");
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-16 bg-[#0A0A0A] text-zinc-100" id="menu-browsing-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Explore Our Gourmet Menu
          </h2>
          <p className="text-zinc-400 text-sm">
            Handcrafted starters, sizzling grills, fresh Asian-infused recipes, and refreshing drinks prepared fresh every day by our world-class kitchen.
          </p>
          <div className="w-12 h-0.5 bg-brand-coral mx-auto rounded-full shadow-[0_0_10px_rgba(242,140,140,0.4)]" />
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10">
          
          {/* Categories Tab list */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 w-full md:w-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-brand-coral text-zinc-950 shadow-lg shadow-brand-coral/20"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850"
              }`}
            >
              All Delicacies
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-brand-coral text-zinc-950 shadow-lg shadow-brand-coral/20"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-850 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-coral/35 focus:border-brand-coral shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              const countInCart = cartQuantities[item.id] || 0;
              return (
                <div
                  key={item.id}
                  className={`bg-[#111111]/90 rounded-2xl border border-zinc-900/60 overflow-hidden shadow-xl hover:border-zinc-800 transition-all duration-300 flex flex-col group h-full ${
                    !item.available ? "opacity-60 select-none animate-pulse" : ""
                  }`}
                >
                  {/* Image container */}
                  <div className="relative overflow-hidden aspect-video bg-zinc-950 shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-cover w-full h-full transition-transform duration-550 group-hover:scale-102 opacity-95 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <UtensilsCrossed className="w-10 h-10" />
                      </div>
                    )}
                    
                    {/* Category Overlay */}
                    <span className="absolute top-3 left-3 bg-zinc-950/90 backdrop-blur-md text-brand-coral text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md border border-zinc-850 font-mono">
                      {item.category}
                    </span>

                    {/* Price tag */}
                    <div className="absolute bottom-3 right-3 bg-zinc-950/90 text-brand-coral font-bold px-3 py-1.5 rounded-lg shadow-md text-xs border border-zinc-850 font-mono">
                      Ksh {item.price.toLocaleString()}
                    </div>

                    {/* Out of Stock banner */}
                    {!item.available && (
                      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-white bg-red-600/90 text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg border border-red-500 shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-brand-coral transition-colors">
                          {item.name}
                        </h3>
                        {item.vegetarian && (
                          <span className="shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md font-mono">
                            Vegetarian
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                        Freshly prepared
                      </span>

                      {item.available ? (
                        <button
                          onClick={() => onAddToCart(item)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 active:scale-95 shadow-md cursor-pointer ${
                            countInCart > 0
                              ? "bg-emerald-500 text-white shadow-emerald-500/10"
                              : "bg-zinc-900 text-white border border-zinc-800 hover:bg-brand-coral hover:text-zinc-950"
                          }`}
                        >
                          {countInCart > 0 ? (
                            <>
                              <Check className="w-4 h-4" />
                              Added ({countInCart})
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add to Basket
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-zinc-950 text-zinc-650 rounded-xl text-xs font-semibold border border-zinc-900 cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#111] rounded-2xl border border-zinc-900 py-16 text-center space-y-4 shadow-xl">
            <div className="bg-zinc-950 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-zinc-500 border border-zinc-900">
              <FilterX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-lg">No Items Match Your Search</p>
              <p className="text-zinc-400 text-xs max-w-xs mx-auto">
                Try selecting a different category or adjusting your search spelling to explore other dishes.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 bg-brand-coral hover:bg-brand-coral-hover text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
