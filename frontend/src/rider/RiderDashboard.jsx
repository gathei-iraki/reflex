import { useEffect, useState } from 'react'
import {
  getRiderDeliveries,
  markPickedUp,
} from '../services/api'

export default function RiderDashboard({
  onSwitchRole,
  onGoToRetailer,
}) {
  const [deliveries, setDeliveries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      setError('')
      setDeliveries(await getRiderDeliveries())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  const handlePickup = async (deliveryId) => {
    try {
      await markPickedUp(deliveryId)
      await loadDeliveries()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              RIDER WORKSPACE
            </p>
            <h1 className="mt-1 text-3xl font-bold">My deliveries</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onGoToRetailer}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              Main dashboard
            </button>

            <button
              onClick={onSwitchRole}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
            >
              Switch role
            </button>
          </div>
        </header>

        {error && (
          <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500">Loading deliveries…</p>
        ) : deliveries.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">
            No deliveries are assigned to you.
          </p>
        ) : (
          <div className="grid gap-4">
            {deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {delivery.customer_name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {delivery.delivery_address}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {delivery.item_description}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {delivery.status.replace('_', ' ')}
                  </span>
                </div>

                {delivery.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handlePickup(delivery.id)}
                    className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark as picked up
                  </button>
                )}

                {delivery.status === 'PICKED_UP' && (
                  <p className="mt-5 text-sm font-medium text-amber-700">
                    Package picked up — ready for delivery confirmation.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}