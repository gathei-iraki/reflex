import { useEffect, useState } from 'react'
import {
  getRiderDeliveries,
  markDelivered,
  markFailed,
  markPickedUp,
} from '../services/api'

const FAILURE_REASONS = [
  ['CUSTOMER_UNAVAILABLE', 'Customer unavailable'],
  ['WRONG_ADDRESS', 'Wrong address'],
  ['PHONE_UNREACHABLE', 'Phone unreachable'],
  ['CUSTOMER_REFUSED', 'Customer refused delivery'],
  ['OTHER', 'Other'],
]

export default function RiderDashboard() {
  const [deliveries, setDeliveries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyDeliveryId, setBusyDeliveryId] = useState(null)
  const [action, setAction] = useState(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [failureReason, setFailureReason] = useState('CUSTOMER_UNAVAILABLE')
  const [failureNotes, setFailureNotes] = useState('')

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

  const runAction = async (deliveryId, operation) => {
    try {
      setBusyDeliveryId(deliveryId)
      setError('')
      await operation()
      setAction(null)
      setConfirmationCode('')
      setFailureReason('CUSTOMER_UNAVAILABLE')
      setFailureNotes('')
      await loadDeliveries()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyDeliveryId(null)
    }
  }

  const handleComplete = (event) => {
    event.preventDefault()
    runAction(action.delivery.id, () =>
      markDelivered(action.delivery.id, confirmationCode.trim()),
    )
  }

  const handleFail = (event) => {
    event.preventDefault()
    runAction(action.delivery.id, () =>
      markFailed(action.delivery.id, failureReason, failureNotes.trim()),
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-emerald-600">RIDER WORKSPACE</p>
          <h1 className="mt-1 text-3xl font-bold">My deliveries</h1>
        </header>

        {error && (
          <p className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
        )}

        {loading ? (
          <p className="text-slate-500">Loading deliveries…</p>
        ) : deliveries.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">No deliveries are assigned to you.</p>
        ) : (
          <div className="grid gap-4">
            {deliveries.map((delivery) => (
              <article key={delivery.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{delivery.customer_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{delivery.delivery_address}</p>
                    <p className="mt-2 text-sm text-slate-600">{delivery.item_description}</p>
                    <p className="mt-2 text-xs text-slate-400">Delivery #{delivery.id}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {delivery.status.replaceAll('_', ' ')}
                  </span>
                </div>

                {delivery.status === 'ASSIGNED' && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={busyDeliveryId === delivery.id}
                      onClick={() => runAction(delivery.id, () => markPickedUp(delivery.id))}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyDeliveryId === delivery.id ? 'Updating…' : 'Mark as picked up'}
                    </button>
                    <button
                      onClick={() => setAction({ type: 'fail', delivery })}
                      className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Mark as failed
                    </button>
                  </div>
                )}

                {delivery.status === 'PICKED_UP' && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => setAction({ type: 'complete', delivery })}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Confirm delivery
                    </button>
                    <button
                      onClick={() => setAction({ type: 'fail', delivery })}
                      className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Mark as failed
                    </button>
                  </div>
                )}

                {delivery.status === 'DELIVERED' && (
                  <p className="mt-5 text-sm font-medium text-emerald-700">Delivered and confirmed.</p>
                )}

                {delivery.status === 'DELIVERY_FAILED' && (
                  <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
                    <p className="font-semibold">Delivery failed</p>
                    <p className="mt-1">{delivery.failure_reason.replaceAll('_', ' ').toLowerCase()}</p>
                    {delivery.failure_notes && <p className="mt-1">{delivery.failure_notes}</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {action?.type === 'complete' && (
        <ActionModal title={`Confirm delivery #${action.delivery.id}`} onClose={() => setAction(null)}>
          <form onSubmit={handleComplete}>
            <label className="block text-sm font-medium text-slate-700">
              Customer confirmation code
              <input
                required
                maxLength={20}
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500"
                placeholder="Enter confirmation code"
              />
            </label>
            <SubmitButtons busy={busyDeliveryId === action.delivery.id} onCancel={() => setAction(null)} submitLabel="Confirm delivered" />
          </form>
        </ActionModal>
      )}

      {action?.type === 'fail' && (
        <ActionModal title={`Failed delivery #${action.delivery.id}`} onClose={() => setAction(null)}>
          <form onSubmit={handleFail} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Failure reason
              <select
                required
                value={failureReason}
                onChange={(event) => setFailureReason(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"
              >
                {FAILURE_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Notes {failureReason === 'OTHER' ? '(required)' : '(optional)'}
              <textarea
                required={failureReason === 'OTHER'}
                rows={3}
                value={failureNotes}
                onChange={(event) => setFailureNotes(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"
                placeholder="Add delivery failure details"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAction(null)}
                disabled={busyDeliveryId === action.delivery.id}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyDeliveryId === action.delivery.id}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {busyDeliveryId === action.delivery.id ? 'Saving…' : 'Confirm failure'}
              </button>
            </div>
          </form>
        </ActionModal>
      )}
    </main>
  )
}

function ActionModal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-5" onMouseDown={onClose}>
      <div className="mx-auto my-8 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <h2 className="mb-5 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function SubmitButtons({ busy, danger = false, onCancel, submitLabel }) {
  return (
    <div className="mt-5 flex justify-end gap-3">
      <button type="button" onClick={onCancel} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
      <button type="submit" disabled={busy} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}
