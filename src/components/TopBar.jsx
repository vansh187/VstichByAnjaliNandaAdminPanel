import { Icon, icons } from './Icon.jsx';

export function TopBar({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-[#2A2620]">
      <div>
        <h1 className="font-serif text-2xl text-[#EDE7DD]">{title}</h1>
        <p className="text-sm text-[#8A8375] mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6858]"><Icon path={icons.search} size={15} /></span>
          <input
            placeholder="Search orders, products..."
            className="bg-[#1C1914] border border-[#2A2620] rounded-full pl-9 pr-4 py-2 text-sm text-[#EDE7DD] placeholder-[#6E6858] w-64 focus:outline-none focus:border-[#C9A24B]"
          />
        </div>
        <button className="relative p-2 rounded-full hover:bg-[#1C1914]">
          <span className="text-[#B8B2A3]"><Icon path={icons.bell} size={17} /></span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
        </button>
      </div>
    </div>
  );
}
