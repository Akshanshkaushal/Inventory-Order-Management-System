import { Boxes, ChevronRight, LayoutDashboard, Menu, ReceiptText, Search, Users, Warehouse, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import Button from '../components/Button.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const navigate = useNavigate();

  function submitHeaderSearch(event) {
    event.preventDefault();
    const query = headerSearch.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  }

  const nav = (
    <nav className="mt-6 space-y-1 px-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-white text-[#101827] shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
          end={to === '/'}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-[#101827] text-white shadow-2xl lg:block">
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white ring-1 ring-white/15">
              <Warehouse className="h-4 w-4" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">Stockroom</p>
              <p className="text-xs text-slate-400">Inventory operations</p>
            </div>
          </div>
        </div>
        {nav}
        <div className="absolute bottom-4 left-4 right-4 rounded-md border border-white/10 bg-white/[0.06] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
          <p className="mt-2 text-sm font-semibold text-white">Main warehouse</p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Production</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:ml-72 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button variant="secondary" className="h-10 w-10 p-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <form
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-500 shadow-sm md:max-w-[460px]"
            onSubmit={submitHeaderSearch}
          >
            <button type="submit" aria-label="Search products" className="text-slate-400 transition hover:text-ink">
              <Search className="h-4 w-4" />
            </button>
            <input
              className="w-full bg-transparent text-sm text-ink placeholder:text-slate-500 focus:outline-none"
              placeholder="Search products by name or SKU"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitHeaderSearch(event);
              }}
            />
          </form>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-sm font-medium text-ink">Main warehouse</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span className="status-dot h-2 w-2 rounded-full bg-accent" />
            Live data
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-[#101827] text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-semibold text-white">Stockroom</p>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <main className="px-4 py-6 lg:ml-72 lg:px-8">
        <div className="app-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
