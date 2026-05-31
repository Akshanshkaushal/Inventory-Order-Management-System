import { AlertTriangle, Boxes, PackageCheck, ReceiptText, TrendingUp, Users } from 'lucide-react';

import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { dashboardApi, productsApi } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { currency } from '../utils/format.js';

function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-blue-50 text-brand',
    teal: 'bg-teal-50 text-accent',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="surface rounded-md p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="metric-label">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function InventoryDonut({ healthy, lowStock }) {
  const total = Math.max(healthy + lowStock, 1);
  const healthyPercent = Math.round((healthy / total) * 100);
  const lowStockPercent = 100 - healthyPercent;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">Stock mix</p>
          <h3 className="mt-2 text-base font-semibold text-ink">Inventory health</h3>
          <p className="mt-1 text-sm text-slate-500">Live split between healthy and low-stock SKUs.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{total} SKUs</span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="7" />
            <circle
              className="animate-chart-draw"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#0f766e"
              strokeWidth="7"
              strokeDasharray={`${healthyPercent} ${100 - healthyPercent}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {lowStock > 0 ? (
              <circle
                className="animate-chart-draw"
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke="#d97706"
                strokeWidth="7"
                strokeDasharray={`${lowStockPercent} ${100 - lowStockPercent}`}
                strokeDashoffset={-healthyPercent}
                strokeLinecap="round"
              />
            ) : null}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-3xl font-semibold text-ink">{healthyPercent}%</p>
              <p className="text-xs font-medium text-slate-500">ready</p>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-3">
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              Healthy stock
            </span>
            <span className="font-semibold text-ink">{healthy}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              Low stock
            </span>
            <span className="font-semibold text-ink">{lowStock}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useAsync(() => dashboardApi.summary(), []);
  const { data: productsData } = useAsync(() => productsApi.list(), []);
  const products = productsData ?? [];
  const healthyCount = data ? Math.max(data.total_products - data.low_stock_products.length, 0) : 0;
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price) * Number(product.quantity_in_stock), 0);
  const lowStockValue = data
    ? data.low_stock_products.reduce((sum, product) => sum + Number(product.price) * Number(product.quantity_in_stock), 0)
    : 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Live warehouse metrics calculated from product, customer, and order records." />

      {loading ? <Skeleton rows={5} /> : null}
      {error ? <EmptyState title="Dashboard unavailable" message={error} /> : null}

      {data ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-[#101827] to-[#1d2a44] p-6 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-200">Operations overview</p>
                  <h2 className="mt-2 text-2xl font-semibold">Inventory control room</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    These numbers are live calculations from the running API and PostgreSQL database.
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-xs text-slate-300">Inventory value</p>
                  <p className="mt-1 text-2xl font-semibold">{currency(inventoryValue)}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-5 p-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="mini-panel">
                    <p className="metric-label">Healthy SKUs</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{healthyCount}</p>
                    <p className="mt-1 text-xs text-slate-500">Above low-stock threshold</p>
                  </div>
                  <div className="mini-panel">
                    <p className="metric-label">Low-stock value</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-700">{currency(lowStockValue)}</p>
                    <p className="mt-1 text-xs text-slate-500">Value currently at risk</p>
                  </div>
                  <div className="mini-panel">
                    <p className="metric-label">Order flow</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{data.total_orders}</p>
                    <p className="mt-1 text-xs text-slate-500">Recorded orders</p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <PackageCheck className="h-5 w-5 text-accent" />
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-8 text-sm text-slate-500">Operational readiness</p>
                <p className="mt-2 text-4xl font-semibold text-ink">
                  {data.total_products ? Math.round((healthyCount / data.total_products) * 100) : 100}%
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${data.total_products ? Math.round((healthyCount / data.total_products) * 100) : 100}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total products" value={data.total_products} icon={Boxes} />
            <StatCard label="Total customers" value={data.total_customers} icon={Users} tone="teal" />
            <StatCard label="Total orders" value={data.total_orders} icon={ReceiptText} tone="slate" />
            <StatCard label="Low stock items" value={data.low_stock_products.length} icon={AlertTriangle} tone="amber" />
          </section>

          <InventoryDonut healthy={healthyCount} lowStock={data.low_stock_products.length} />

          <section className="surface overflow-hidden rounded-md">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">Low Stock Products</h2>
            </div>
            {data.low_stock_products.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No low stock products" message="Everything is above the configured threshold." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-line text-sm">
                  <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.low_stock_products.map((product) => (
                      <tr key={product.id} className="row-hover">
                        <td className="px-5 py-3 font-medium text-ink">{product.product_name}</td>
                        <td className="px-5 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-5 py-3 text-slate-600">{currency(product.price)}</td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            {product.quantity_in_stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
