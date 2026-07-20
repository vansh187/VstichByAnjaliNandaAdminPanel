export function MarketingTab() {
  return (
    <div className="p-8 grid grid-cols-2 gap-5">
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Active Coupons</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[#EDE7DD]">FESTIVE20</span><span className="text-[#B8B2A3]">20% off · min ₹2,000</span></div>
          <div className="flex justify-between"><span className="text-[#EDE7DD]">WELCOME150</span><span className="text-[#B8B2A3]">₹150 off · first order</span></div>
        </div>
      </div>
      <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg p-5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375] mb-3">Homepage Banner</div>
        <div className="h-20 rounded-md bg-gradient-to-r from-[#3A2E1F] to-[#2A2440] flex items-center justify-center text-[#E8C88A] font-serif text-sm">Festive Collection — Live</div>
      </div>
    </div>
  );
}
