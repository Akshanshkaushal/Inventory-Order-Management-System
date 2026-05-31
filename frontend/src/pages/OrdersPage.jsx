import { Eye, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FieldError from '../components/FieldError.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { customersApi, ordersApi, productsApi } from '../services/api.js';
import { currency, date } from '../utils/format.js';

function OrderForm({ customers, products, onSubmit, submitting }) {
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { customer_id: '' } });

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = products.find((item) => String(item.id) === String(line.product_id));
        return sum + (product ? Number(product.price) * Number(line.quantity || 0) : 0);
      }, 0),
    [lines, products],
  );

  function submit(values) {
    onSubmit({
      customer_id: Number(values.customer_id),
      items: lines.map((line) => ({ product_id: Number(line.product_id), quantity: Number(line.quantity) })),
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(submit)}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="metric-label">Customer</p>
        <label className="field-label mt-4 block">
          Buyer account
          <select className="field mt-1.5" {...register('customer_id', { required: 'Choose a customer' })}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.full_name}
              </option>
            ))}
          </select>
          <FieldError message={errors.customer_id?.message} />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="metric-label">Line items</p>
            <p className="mt-1 text-sm text-slate-500">Choose stocked products and requested quantities.</p>
          </div>
          <Button variant="secondary" className="shrink-0" onClick={() => setLines((current) => [...current, { product_id: '', quantity: 1 }])}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((line, index) => {
            const selectedProduct = products.find((item) => String(item.id) === String(line.product_id));
            const lineSubtotal = selectedProduct ? Number(selectedProduct.price) * Number(line.quantity || 0) : 0;
            return (
              <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-3 md:grid-cols-[1fr_110px_44px]">
                  <label className="field-label">
                    Product
                    <select
                      className="field mt-1.5"
                      value={line.product_id}
                      onChange={(event) =>
                        setLines((current) => current.map((item, lineIndex) => (lineIndex === index ? { ...item, product_id: event.target.value } : item)))
                      }
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_name} ({product.quantity_in_stock} available)
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Qty
                    <input
                      type="number"
                      min="1"
                      className="field mt-1.5"
                      value={line.quantity}
                      onChange={(event) =>
                        setLines((current) => current.map((item, lineIndex) => (lineIndex === index ? { ...item, quantity: event.target.value } : item)))
                      }
                      required
                    />
                  </label>
                  <button
                    type="button"
                    className="mt-6 grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={lines.length === 1}
                    onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                    aria-label="Remove line"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm text-slate-600">
                  <span>{selectedProduct ? `${currency(selectedProduct.price)} each` : 'Choose a product to calculate this line'}</span>
                  <span className="font-semibold text-ink">{currency(lineSubtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between rounded-md bg-[#101827] px-4 py-3 text-white">
          <span className="text-sm text-slate-300">Estimated total</span>
          <span className="text-xl font-semibold">{currency(total)}</span>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            Create order
          </Button>
        </div>
      </div>
    </form>
  );
}

function OrderDetails({ order }) {
  if (!order) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-slate-500">Customer</p>
          <p className="font-medium text-ink">{order.customer.full_name}</p>
        </div>
        <div>
          <p className="text-slate-500">Status</p>
          <p className="font-medium capitalize text-ink">{order.status}</p>
        </div>
        <div>
          <p className="text-slate-500">Created</p>
          <p className="font-medium text-ink">{date(order.created_at)}</p>
        </div>
        <div>
          <p className="text-slate-500">Total</p>
          <p className="font-medium text-ink">{currency(order.total_amount)}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Unit price</th>
              <th className="px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-ink">{item.product.product_name}</td>
                <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{currency(item.unit_price)}</td>
                <td className="px-4 py-3 text-slate-600">{currency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { pushToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: ordersData, loading, error, refetch } = useAsync(() => ordersApi.list(), []);
  const { data: customersData } = useAsync(() => customersApi.list(), []);
  const { data: productsData, refetch: refetchProducts } = useAsync(() => productsApi.list(), []);
  const orders = ordersData ?? [];
  const customers = customersData ?? [];
  const products = productsData ?? [];

  async function createOrder(payload) {
    setSubmitting(true);
    try {
      await ordersApi.create(payload);
      pushToast('Order created');
      setShowForm(false);
      await refetch();
      await refetchProducts();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelOrder() {
    try {
      await ordersApi.remove(confirming.id);
      pushToast('Order cancelled');
      setConfirming(null);
      await refetch();
      await refetchProducts();
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Create customer orders and review line-level totals."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Create order
          </Button>
        }
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="surface rounded-md p-4">
          <p className="metric-label">Total orders</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{orders.length}</p>
        </div>
        <div className="surface rounded-md p-4">
          <p className="metric-label">Open</p>
          <p className="mt-2 text-2xl font-semibold text-teal-700">{orders.filter((order) => order.status !== 'cancelled').length}</p>
        </div>
        <div className="surface rounded-md p-4">
          <p className="metric-label">Cancelled</p>
          <p className="mt-2 text-2xl font-semibold text-slate-600">{orders.filter((order) => order.status === 'cancelled').length}</p>
        </div>
      </section>

      {loading ? <Skeleton /> : null}
      {error ? <EmptyState title="Orders unavailable" message={error} /> : null}
      {!loading && !error && orders.length === 0 ? <EmptyState title="No orders yet" message="Create an order after adding products and customers." /> : null}

      {orders.length > 0 ? (
        <section className="surface overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="row-hover">
                    <td className="px-5 py-3 font-medium text-ink">#{order.id}</td>
                    <td className="px-5 py-3 text-slate-600">{order.customer.full_name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${order.status === 'cancelled' ? 'bg-slate-100 text-slate-700' : 'bg-teal-100 text-teal-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{currency(order.total_amount)}</td>
                    <td className="px-5 py-3 text-slate-600">{date(order.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" className="h-9 w-9 p-0" aria-label="View order" onClick={() => setViewing(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          className="h-9 w-9 p-0"
                          disabled={order.status === 'cancelled'}
                          aria-label="Cancel order"
                          onClick={() => setConfirming(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Modal open={showForm} title="Create order" onClose={() => setShowForm(false)}>
        <OrderForm customers={customers} products={products} onSubmit={createOrder} submitting={submitting} />
      </Modal>
      <Modal open={Boolean(viewing)} title={`Order #${viewing?.id || ''}`} onClose={() => setViewing(null)}>
        <OrderDetails order={viewing} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirming)}
        title="Cancel order"
        message={`Cancel order #${confirming?.id || ''}? Stock will be returned to inventory.`}
        confirmLabel="Cancel order"
        onClose={() => setConfirming(null)}
        onConfirm={cancelOrder}
      />
    </>
  );
}
