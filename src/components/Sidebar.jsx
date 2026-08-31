import { Icon, icons } from './Icon.jsx';

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "orders", label: "Order Management" },
  { key: "allOrders", label: "All Orders" },
  { key: "products", label: "Product Management" },
  { key: "payments", label: "Payments & Finance" },
  { key: "shipping", label: "Shipping" },
  { key: "marketing", label: "Marketing" },
];

export function Sidebar({ active, setActive, onLogout }) {
  return (
    <div className="w-60 shrink-0 bg-[#15130F] border-r border-[#2A2620] flex flex-col">
      <div className="px-6 py-6 border-b border-[#2A2620]">
        <div className="font-serif text-xl tracking-wide text-[#E8C88A]">V Stitch</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8A8375] mt-1">Admin Studio</div>
      </div>
      <nav className="flex-1 py-4">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? "bg-[#221E17] text-[#E8C88A] border-r-2 border-[#C9A24B]"
                  : "text-[#B8B2A3] hover:bg-[#1C1914] hover:text-[#EDE7DD]"
              }`}
            >
              <Icon path={icons[t.key]} />
              {t.label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-[#2A2620] flex items-center justify-between">
        <span className="text-[10px] text-[#6E6858] uppercase tracking-[0.15em]">Logged in as Admin</span>
        <button
          onClick={onLogout}
          className="text-[10px] uppercase tracking-[0.1em] text-[#8A8375] hover:text-[#E0716A]"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
