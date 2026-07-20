export function StatCard({ label, value, accent }) {
  return (
    <div className="bg-[#1C1914] border border-[#2A2620] rounded-lg px-5 py-4 flex-1">
      <div className="text-[11px] uppercase tracking-[0.15em] text-[#8A8375]">{label}</div>
      <div className={`text-2xl font-serif mt-2 ${accent || "text-[#EDE7DD]"}`}>{value}</div>
    </div>
  );
}
