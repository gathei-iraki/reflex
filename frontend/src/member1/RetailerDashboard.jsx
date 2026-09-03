import React, { useEffect, useMemo, useState } from 'react';
import { createDelivery, getDeliveries } from '../services/api';

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  address: '',
  itemDescription: '',
};

const STATUS_META = {
  NEW: {
    label: 'New',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  ASSIGNED: {
    label: 'Assigned',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  PICKED_UP: {
    label: 'Picked up',
    classes: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  },
  DELIVERED: {
    label: 'Delivered',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  DELIVERY_FAILED: {
    label: 'Failed',
    classes: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status || 'Unknown',
    classes: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.classes}`}
    >
      {meta.label}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function getTimeline(delivery) {
  if (Array.isArray(delivery.timeline)) return delivery.timeline;
  if (Array.isArray(delivery.events)) {
    return delivery.events.map((event) => ({
      event:
        event.event ||
        event.status ||
        event.note ||
        'Delivery updated',
      timestamp: event.timestamp || event.createdAt || event.created_at,
      note: event.note,
    }));
  }
  return [];
}

function getField(delivery, ...names) {
  for (const name of names) {
    if (delivery?.[name] !== undefined && delivery?.[name] !== null) {
      return delivery[name];
    }
  }
  return '';
}

export default function RetailerDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [view, setView] = useState('list');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formError, setFormError] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setDashboardError('');
        setDeliveries(await getDeliveries());
      } catch (error) {
        setDashboardError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  const counts = useMemo(
    () => ({
      total: deliveries.length,
      new: deliveries.filter((d) => d.status === 'NEW').length,
      active: deliveries.filter(
        (d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP'
      ).length,
      delivered: deliveries.filter((d) => d.status === 'DELIVERED').length,
      failed: deliveries.filter((d) => d.status === 'DELIVERY_FAILED').length,
    }),
    [deliveries]
  );

  const filteredDeliveries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesStatus =
        statusFilter === 'ALL' || delivery.status === statusFilter;

      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

      const values = [
        delivery.id,
        getField(delivery, 'customerName', 'customer_name'),
        getField(delivery, 'phone', 'customerPhone', 'customer_phone'),
        getField(delivery, 'address', 'deliveryAddress', 'delivery_address'),
      ];

      return values.some((value) =>
        String(value || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [deliveries, query, statusFilter]);

  const openCreate = () => {
    setSelectedDelivery(null);
    setFormError('');
    setForm(EMPTY_FORM);
    setView('create');
  };

  const openList = () => {
    setSelectedDelivery(null);
    setFormError('');
    setView('list');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError('');

    const values = {
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      itemDescription: form.itemDescription.trim(),
    };

    if (Object.values(values).some((value) => !value)) {
      setFormError('Complete all fields before submitting the delivery request.');
      return;
    }

    try {
      setSubmitting(true);
      const delivery = await createDelivery(values);
      setDeliveries((current) => [delivery, ...current]);
      setForm(EMPTY_FORM);
      setView('list');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Retailer</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Delivery Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create requests and monitor your deliveries.
          </p>
        </div>

        <button
          type="button"
          onClick={view === 'create' ? openList : openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          {view === 'create' ? 'View My Deliveries' : '+ Create Delivery'}
        </button>
      </header>

      {dashboardError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {dashboardError}
        </div>
      )}

      {view === 'create' ? (
        <form
          onSubmit={handleCreate}
          className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              New Delivery Request
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the customer and delivery information.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Customer name
              </span>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.customerName}
                onChange={(event) =>
                  setForm({ ...form, customerName: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Jane Doe"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Phone number
              </span>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="0712345678"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Delivery address
              </span>
              <input
                type="text"
                required
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Westlands, Nairobi"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Item description
              </span>
              <textarea
                required
                rows={4}
                value={form.itemDescription}
                onChange={(event) =>
                  setForm({ ...form, itemDescription: event.target.value })
                }
                className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="One box of office supplies"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={openList}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      ) : selectedDelivery ? (
        <DeliveryDetails
          delivery={selectedDelivery}
          onBack={openList}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Total" value={counts.total} />
            <MetricCard label="New" value={counts.new} />
            <MetricCard label="In progress" value={counts.active} />
            <MetricCard label="Delivered" value={counts.delivered} />
            <MetricCard label="Failed" value={counts.failed} />
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">My Deliveries</h2>
                <p className="text-sm text-gray-500">
                  {filteredDeliveries.length} of {deliveries.length} deliveries
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search deliveries..."
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All statuses</option>
                  {Object.keys(STATUS_META).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-gray-500">
                Loading deliveries…
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <h3 className="font-semibold text-gray-900">
                  No deliveries found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {deliveries.length === 0
                    ? 'Create your first delivery request to get started.'
                    : 'Try a different search or status filter.'}
                </p>
                {deliveries.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Create Delivery
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Delivery
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Customer
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Address
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-gray-900">
                          #{delivery.id}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">
                            {getField(delivery, 'customerName', 'customer_name') || '—'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getField(delivery, 'phone', 'customerPhone', 'customer_phone') || '—'}
                          </div>
                        </td>
                        <td className="max-w-xs px-5 py-4 text-sm text-gray-600">
                          <span className="line-clamp-2">
                            {getField(delivery, 'address', 'deliveryAddress', 'delivery_address') || '—'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={delivery.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedDelivery(delivery)}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
    </div>
  );
}

function DeliveryDetails({ delivery, onBack }) {
  const timeline = getTimeline(delivery);
  const customerName = getField(delivery, 'customerName', 'customer_name');
  const phone = getField(delivery, 'phone', 'customerPhone', 'customer_phone');
  const address = getField(delivery, 'address', 'deliveryAddress', 'delivery_address');
  const itemDescription = getField(
    delivery,
    'itemDescription',
    'item_description'
  );
  const riderName = getField(delivery, 'assignedRiderName', 'assigned_rider_name', 'rider_name');
  const failureReason = getField(delivery, 'failureReason', 'failure_reason');
  const failureNotes = getField(delivery, 'failureNotes', 'failure_notes');

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Back to deliveries
        </button>

        <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Delivery</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              #{delivery.id}
            </h2>
          </div>
          <StatusBadge status={delivery.status} />
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          <Detail label="Customer" value={customerName} />
          <Detail label="Phone" value={phone} />
          <Detail label="Delivery address" value={address} />
          <Detail label="Assigned rider" value={riderName || 'Not assigned'} />
          <Detail
            label="Item description"
            value={itemDescription}
            fullWidth
          />
        </dl>

        {failureReason && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Delivery failed
            </p>
            <p className="mt-1 text-sm text-red-700">
              Reason: {failureReason}
            </p>
            {failureNotes && (
              <p className="mt-1 text-sm text-red-700">
                {failureNotes}
              </p>
            )}
          </div>
        )}
      </article>

      <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Delivery timeline</h3>
        <p className="mt-1 text-sm text-gray-500">
          Recorded delivery lifecycle events
        </p>

        {timeline.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">No timeline events available.</p>
        ) : (
          <ol className="relative mt-6 border-l border-gray-200">
            {timeline.map((event, index) => (
              <li key={`${event.timestamp || 'event'}-${index}`} className="mb-7 ml-5 last:mb-0">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <p className="text-sm font-semibold text-gray-900">
                  {event.event || event.status || 'Delivery updated'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(event.timestamp)}
                </p>
                {event.note && (
                  <p className="mt-2 text-sm leading-5 text-gray-600">
                    {event.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

function Detail({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-gray-900">{value || '—'}</dd>
    </div>
  );
}
