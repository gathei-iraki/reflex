import { useEffect, useState } from 'react'
import {
  assignRider,
  getFailedDeliveries,
  getNewDeliveries,
  getRiderWorkload,
} from '../services/api'

export default function DispatcherDashboard({
  onSwitchRole,
  onGoToRetailer,
}) {
  const [deliveries, setDeliveries] = useState([])
  const [riders, setRiders] = useState([])
  const [failedDeliveries, setFailedDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      const [deliveryData, riderData, failedDeliveryData] = await Promise.all([
        getNewDeliveries(),
        getRiderWorkload(),
        getFailedDeliveries(),
      ])

      setDeliveries(deliveryData)
      setRiders(riderData)
      setFailedDeliveries(failedDeliveryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleAssign = async (riderId) => {
    try {
      await assignRider(selectedDelivery.id, riderId)
      setSelectedDelivery(null)
      await loadDashboard()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              DISPATCHER WORKSPACE
            </p>
            <h1 className="mt-1 text-3xl font-bold">Assign deliveries</h1>
            <p className="mt-2 text-slate-500">
              Assign each new delivery to an available rider.
            </p>
          </div>

          
        </header>

        {error && (
          <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-bold">Rider workload</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {riders.map((rider) => (
              <div
                key={rider.id}
                className="rounded-xl bg-slate-100 px-4 py-3 text-sm"
              >
                <p className="font-semibold">{rider.name}</p>
                <p className="text-slate-500">
                  {rider.active_deliveries} active deliveries
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold">New deliveries ({deliveries.length})</h2>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading deliveries…</p>
          ) : deliveries.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No new deliveries are waiting for assignment.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{delivery.customer_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {delivery.delivery_address}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {delivery.item_description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Delivery #{delivery.id}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedDelivery(delivery)}
                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Assign rider
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-rose-700">Failed deliveries ({failedDeliveries.length})</h2>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading failed deliveries…</p>
          ) : failedDeliveries.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No failed deliveries.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {failedDeliveries.map((delivery) => (
                <div key={delivery.id} className="p-5">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <p className="font-semibold">Delivery #{delivery.id} · {delivery.customer_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{delivery.delivery_address}</p>
                    </div>
                    <span className="h-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Delivery failed</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-rose-700">
                    Reason: {delivery.failure_reason.replaceAll('_', ' ').toLowerCase()}
                  </p>
                  {delivery.failure_notes && <p className="mt-1 text-sm text-slate-600">{delivery.failure_notes}</p>}
                  <p className="mt-2 text-xs text-slate-400">Rider: {delivery.rider_name || 'Unknown'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 grid place-items-center bg-slate-950/40 p-5">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              Assign delivery #{selectedDelivery.id}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose an active rider.
            </p>

            <div className="mt-5 space-y-2">
              {riders.map((rider) => (
                <button
                  key={rider.id}
                  onClick={() => handleAssign(rider.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:bg-violet-50"
                >
                  <span className="font-semibold">{rider.name}</span>
                  <span className="text-sm text-slate-500">
                    {rider.active_deliveries} active
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDelivery(null)}
              className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
