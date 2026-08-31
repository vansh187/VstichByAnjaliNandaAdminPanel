import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { TopBar } from './components/TopBar.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { DashboardTab } from './tabs/DashboardTab.jsx';
import { OrdersTab } from './tabs/OrdersTab.jsx';
import { AllOrdersTab } from './tabs/AllOrdersTab.jsx';
import { ProductsTab } from './tabs/ProductsTab.jsx';
import { CollectionsTab } from './tabs/CollectionsTab.jsx';
import { PaymentsTab } from './tabs/PaymentsTab.jsx';
import { ShippingTab } from './tabs/ShippingTab.jsx';
import { MarketingTab } from './tabs/MarketingTab.jsx';
import { getAdminToken, setAdminToken, AUTH_EXPIRED_EVENT } from './api/client.js';

const TAB_META = {
  dashboard: { title: "Dashboard", subtitle: "Today at a glance", Comp: DashboardTab },
  orders: { title: "Order Management", subtitle: "Track and update order status in real time", Comp: OrdersTab },
  allOrders: { title: "All Orders", subtitle: "Every order with one-click Ready to Ship", Comp: AllOrdersTab },
  products: { title: "Product Management", subtitle: "Catalogue, stock and pricing", Comp: ProductsTab },
  collections: { title: "Collections", subtitle: "Curate seasonal collections like Summer Luxe", Comp: CollectionsTab },
  payments: { title: "Payments & Finance", subtitle: "Reconciliation and revenue", Comp: PaymentsTab },
  shipping: { title: "Shipping", subtitle: "Courier assignment and tracking", Comp: ShippingTab },
  marketing: { title: "Marketing", subtitle: "Coupons, banners and campaigns", Comp: MarketingTab },
};

function App() {
  const [authed, setAuthed] = useState(() => !!getAdminToken());
  const [active, setActive] = useState("orders");

  useEffect(() => {
    const handleExpired = () => setAuthed(false);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  if (!authed) {
    return <LoginScreen onLoggedIn={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    setAdminToken(null);
    setAuthed(false);
  };

  const { title, subtitle, Comp } = TAB_META[active];

  return (
    <div className="flex h-screen bg-[#14120F] text-[#EDE7DD]">
      <Sidebar active={active} setActive={setActive} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-auto">
        <TopBar title={title} subtitle={subtitle} />
        <ErrorBoundary key={active}>
          <Comp />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
