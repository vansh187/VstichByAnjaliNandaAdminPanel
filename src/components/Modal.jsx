export function Modal({ open, onClose, title, subtitle, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 bg-black/60">
      <div className={`bg-[#1C1914] border border-[#2A2620] rounded-lg w-full ${wide ? "max-w-3xl" : "max-w-lg"} shadow-2xl`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#2A2620]">
          <div>
            <h2 className="font-serif text-xl text-[#EDE7DD]">{title}</h2>
            {subtitle && <p className="text-sm text-[#8A8375] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8375] hover:text-[#EDE7DD] text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
