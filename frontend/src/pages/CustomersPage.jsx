import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { customersApi } from '../services/api.js';

function CustomerForm({ onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { full_name: '', email: '', phone_number: '' } });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="metric-label">Customer profile</p>
        <div className="mt-4 grid gap-4">
          <label className="field-label">
            Full name
            <input className="field mt-1.5" placeholder="Example: Northstar Retail Group" {...register('full_name', { required: 'Full name is required' })} />
            <FieldError message={errors.full_name?.message} />
          </label>
          <label className="field-label">
            Email
            <input
              type="email"
              className="field mt-1.5"
              placeholder="purchasing@example.com"
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' } })}
            />
            <FieldError message={errors.email?.message} />
          </label>
          <label className="field-label">
            Phone number
            <input className="field mt-1.5" placeholder="+1-555-0142" {...register('phone_number', { required: 'Phone number is required' })} />
            <FieldError message={errors.phone_number?.message} />
          </label>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            Add customer
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function CustomersPage() {
  const { pushToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: customersData, loading, error, refetch } = useAsync(() => customersApi.list(), []);
  const customers = customersData ?? [];

  async function createCustomer(values) {
    setSubmitting(true);
    try {
      await customersApi.create(values);
      pushToast('Customer created');
      setShowForm(false);
      await refetch();
    } catch (err) {
      pushToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCustomer() {
    try {
      await customersApi.remove(confirming.id);
      pushToast('Customer deleted');
      setConfirming(null);
      await refetch();
    } catch (err) {
      pushToast(err.message, 'error');
    }
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage buyer contacts used for order creation."
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      <section className="surface mb-4 rounded-md p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="metric-label">Customer directory</p>
            <p className="mt-1 text-sm text-slate-600">Verified buyers available for new orders.</p>
          </div>
          <p className="text-2xl font-semibold text-ink">{customers.length}</p>
        </div>
      </section>

      {loading ? <Skeleton /> : null}
      {error ? <EmptyState title="Customers unavailable" message={error} /> : null}
      {!loading && !error && customers.length === 0 ? <EmptyState title="No customers yet" message="Add a customer before creating orders." /> : null}

      {customers.length > 0 ? (
        <section className="surface overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map((customer) => (
                  <tr key={customer.id} className="row-hover">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{customer.full_name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">Approved purchasing contact</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{customer.email}</td>
                    <td className="px-5 py-3 text-slate-600">{customer.phone_number}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" className="h-9 w-9 p-0" aria-label="Delete customer" onClick={() => setConfirming(customer)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Modal open={showForm} title="Add customer" onClose={() => setShowForm(false)}>
        <CustomerForm onSubmit={createCustomer} submitting={submitting} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirming)}
        title="Delete customer"
        message={`Delete ${confirming?.full_name || 'this customer'} from active customer records? Customers with order history are retained for traceability.`}
        onClose={() => setConfirming(null)}
        onConfirm={deleteCustomer}
      />
    </>
  );
}
