import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import FieldError from '../components/FieldError.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { productsApi } from '../services/api.js';
import { currency } from '../utils/format.js';

const defaultValues = { product_name: '', sku: '', price: '', quantity_in_stock: '' };

function StockBadge({ value }) {
  const stock = Number(value);
  const style =
    stock <= 5
      ? 'bg-red-50 text-red-700 border-red-200'
      : stock <= 10
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-teal-50 text-teal-700 border-teal-200';
  return <span className={`inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{stock}</span>;
}

function ProductForm({ product, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: product
      ? {
          product_name: product.product_name,
          sku: product.sku,
          price: product.price,
          quantity_in_stock: product.quantity_in_stock,
        }
      : defaultValues,
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="metric-label">Product details</p>
        <div className="mt-4 grid gap-4">
          <label className="field-label">
            Product name
            <input
              className="field mt-1.5"
              placeholder="Example: Zebra ZD421 Thermal Label Printer"
              {...register('product_name', { required: 'Product name is required', minLength: { value: 2, message: 'Use at least 2 characters' } })}
            />
            <FieldError message={errors.product_name?.message} />
          </label>
          <label className="field-label">
            SKU
            <input
              className="field mt-1.5 uppercase"
              placeholder="ZBR-ZD421"
              {...register('sku', { required: 'SKU is required', minLength: { value: 2, message: 'Use at least 2 characters' } })}
            />
            <FieldError message={errors.sku?.message} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="metric-label">Stock and pricing</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            Unit price
            <input
              type="number"
              step="0.01"
              min="0"
              className="field mt-1.5"
              {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price cannot be negative' } })}
            />
            <FieldError message={errors.price?.message} />
          </label>
          <label className="field-label">
            Stock on hand
            <input
              type="number"
              min="0"
              className="field mt-1.5"
              {...register('quantity_in_stock', { required: 'Stock is required', min: { value: 0, message: 'Stock cannot be negative' } })}
            />
            <FieldError message={errors.quantity_in_stock?.message} />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const { pushToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearch(query);
    setPage(0);
  }, [searchParams]);

  const { data: productsData, loading, error, refetch } = useAsync(() => productsApi.list({ search }), [search]);
  const { data: allProductsData, refetch: refetchAllProducts } = useAsync(() => productsApi.list(), []);
  const products = useMemo(() => productsData ?? [], [productsData]);
  const allProducts = useMemo(() => allProductsData ?? [], [allProductsData]);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const currentProducts = useMemo(() => products.slice(page * pageSize, page * pageSize + pageSize), [products, page]);
  const lowStockCount = allProducts.filter((product) => Number(product.quantity_in_stock) <= 10).length;
  const inventoryValue = allProducts.reduce((sum, product) => sum + Number(product.price) * Number(product.quantity_in_stock), 0);

  function updateSearch(value) {
    setSearch(value);
    setPage(0);
    const query = value.trim();
    setSearchParams(query ? { search: query } : {});
  }

  async function saveProduct(values) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        price: Number(values.price),
        quantity_in_stock: Number(values.quantity_in_stock),
      };
      if (editing) {
        await productsApi.update(editing.id, payload);
        pushToast('Product updated');
      } else {
        await productsApi.create(payload);
        pushToast('Product created');
      }
      setShowForm(false);
      setEditing(null);
      await refetch();
      await refetchAllProducts();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteProduct() {
    try {
      await productsApi.remove(confirming.id);
      pushToast('Product deleted');
      setConfirming(null);
      await refetch();
      await refetchAllProducts();
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description="Maintain the products your team buys, stores, and ships."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="surface rounded-md p-4">
          <p className="metric-label">Catalog size</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{allProducts.length}</p>
          <p className="mt-1 text-xs text-slate-500">All products in PostgreSQL</p>
        </div>
        <div className="surface rounded-md p-4">
          <p className="metric-label">Low stock</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{lowStockCount}</p>
          <p className="mt-1 text-xs text-slate-500">Items at or below threshold</p>
        </div>
        <div className="surface rounded-md p-4">
          <p className="metric-label">Inventory value</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{currency(inventoryValue)}</p>
          <p className="mt-1 text-xs text-slate-500">Price multiplied by stock</p>
        </div>
      </section>

      <div className="surface mb-4 flex items-center gap-2 rounded-md px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="focus:outline-none w-full bg-transparent text-sm"
          placeholder="Search by product name or SKU"
          value={search}
          onChange={(event) => {
            updateSearch(event.target.value);
          }}
        />
        {search ? (
          <button className="text-xs font-medium text-slate-500 hover:text-ink" type="button" onClick={() => updateSearch('')}>
            Clear
          </button>
        ) : null}
      </div>

      {loading ? <Skeleton /> : null}
      {error ? <EmptyState title="Products unavailable" message={error} /> : null}
      {!loading && !error && products.length === 0 ? <EmptyState title="No products found" message="Add the first product to start tracking stock." /> : null}

      {products.length > 0 ? (
        <section className="surface overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="row-hover">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{product.product_name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">Active inventory item</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{product.sku}</td>
                    <td className="px-5 py-3 text-slate-600">{currency(product.price)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <StockBadge value={product.quantity_in_stock} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 w-9 p-0"
                          aria-label="Edit product"
                          onClick={() => {
                            setEditing(product);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" className="h-9 w-9 p-0" aria-label="Delete product" onClick={() => setConfirming(product)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate-600">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                Previous
              </Button>
              <Button variant="secondary" disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>
                Next
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Modal open={showForm} title={editing ? 'Edit product' : 'Add product'} onClose={() => setShowForm(false)}>
        <ProductForm product={editing} onSubmit={saveProduct} submitting={submitting} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete product"
        message={`Delete ${confirming?.product_name || 'this product'} from active inventory? Products already used in orders are kept for accurate order history.`}
        onClose={() => setConfirming(null)}
        onConfirm={deleteProduct}
      />
    </>
  );
}
