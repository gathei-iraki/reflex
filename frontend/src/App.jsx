import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'reflex.retailer.deliveries.v1'
const emptyForm = { customerName: '', phone: '', address: '', itemDescription: '' }
const statusClasses = {
  NEW: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ASSIGNED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  PICKED_UP: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DELIVERY_FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const formatStatus = (status) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const formatTime = (date) => new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))

function readDeliveries() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function StatusPill({ status }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses[status]}`}>{formatStatus(status)}</span>
}

function RolePicker({ onChoose }) {
  const roles = [
    ['retailer', 'Retailer', 'Create and follow up on every customer delivery.', 'R', 'bg-blue-600'],
    ['dispatcher', 'Dispatcher', 'Assign open deliveries and manage your riders.', 'D', 'bg-violet-600'],
    ['rider', 'Rider', 'View jobs and update delivery progress.', 'R', 'bg-emerald-600'],
  ]
  return <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:flex sm:items-center sm:justify-center"><div className="w-full max-w-5xl"><div className="mb-12 text-center"><div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 text-2xl font-black">R</div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">Delivery coordination, simplified</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to Reflex</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">Choose your workspace to get started. Every delivery stays visible from request to confirmation.</p></div><div className="grid gap-5 md:grid-cols-3">{roles.map(([key, title, description, icon, color]) => <button key={key} onClick={() => onChoose(key)} className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 text-left transition hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800"><span className={`mb-12 grid h-12 w-12 place-items-center rounded-2xl text-xl font-bold ${color}`}>{icon}</span><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{description}</p><span className="mt-6 inline-block text-sm font-semibold text-blue-300 group-hover:text-white">Open workspace →</span></button>)}</div></div></main>
}

function App() {
  const [role, setRole] = useState(null)
  const [screen, setScreen] = useState('deliveries')
  const [deliveries, setDeliveries] = useState(readDeliveries)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries))
  }, [deliveries])

  const selected = deliveries.find((delivery) => delivery.id === selectedId) || deliveries[0]
  const visible = useMemo(() => deliveries.filter((delivery) => {
    const term = query.trim().toLowerCase()
    return (filter === 'ALL' || delivery.status === filter) && (!term || [delivery.id, delivery.customerName, delivery.address].some((value) => value.toLowerCase().includes(term)))
  }), [deliveries, filter, query])
  const active = deliveries.filter((delivery) => ['NEW', 'ASSIGNED', 'PICKED_UP'].includes(delivery.status)).length
  const delivered = deliveries.filter((delivery) => delivery.status === 'DELIVERED').length
  const attention = deliveries.filter((delivery) => delivery.status === 'DELIVERY_FAILED').length

  function createDelivery(event) {
    event.preventDefault()
    const now = new Date().toISOString()
    const delivery = {
      id: `RFX-${Date.now().toString().slice(-6)}`,
      ...form,
      status: 'NEW',
      createdAt: now,
      timeline: [{ label: 'Delivery request created', at: now }],
    }
    setDeliveries((items) => [delivery, ...items])
    setSelectedId(delivery.id)
    setForm(emptyForm)
    setScreen('deliveries')
    setNotice(`${delivery.id} was saved on this device and is ready for assignment.`)
  }

  if (!role) return <RolePicker onChoose={setRole} />
  if (role !== 'retailer') return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center"><div className="max-w-md rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">R</div><h1 className="mt-5 text-2xl font-bold">{formatStatus(role)} workspace</h1><p className="mt-3 leading-6 text-slate-500">This demo currently focuses on the retailer workflow. Select Retailer to create and track deliveries.</p><button onClick={() => setRole(null)} className="mt-7 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Choose another role</button></div></main>

  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><button onClick={() => setRole(null)} className="flex items-center gap-3 text-left"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-black text-white">R</span><span><span className="block font-bold">Reflex</span><span className="block text-xs text-slate-500">Retailer workspace</span></span></button><button onClick={() => setRole(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Switch role</button></div></header><main className="mx-auto max-w-7xl px-5 py-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-600">RETAILER WORKSPACE</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Your deliveries</h1><p className="mt-2 text-slate-500">Delivery requests you create are saved automatically in this browser.</p></div><button onClick={() => setScreen(screen === 'create' ? 'deliveries' : 'create')} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700">{screen === 'create' ? '← Back to deliveries' : '+ New delivery'}</button></div>{notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>✓ {notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}{screen === 'create' ? <DeliveryForm form={form} setForm={setForm} onSubmit={createDelivery} onCancel={() => setScreen('deliveries')} /> : <><section className="mb-7 grid gap-4 sm:grid-cols-3"><Metric label="Active deliveries" value={active} hint="Awaiting pickup or in transit" color="text-blue-600" /><Metric label="Delivered" value={delivered} hint="Successfully completed" color="text-emerald-600" /><Metric label="Needs attention" value={attention} hint="Failed delivery attempts" color="text-rose-600" /></section><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-100 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold">All deliveries <span className="ml-1 text-sm font-medium text-slate-400">({visible.length})</span></h2><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or ID" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1">{['ALL', 'NEW', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'DELIVERY_FAILED'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item === 'ALL' ? 'All' : formatStatus(item)}</button>)}</div></div><div className="divide-y divide-slate-100">{visible.map((delivery) => <button key={delivery.id} onClick={() => setSelectedId(delivery.id)} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 p-5 text-left transition hover:bg-slate-50 sm:grid-cols-[1.4fr_1fr_auto] ${selected?.id === delivery.id ? 'bg-blue-50/60' : ''}`}><div><p className="font-semibold">{delivery.customerName}</p><p className="mt-1 text-sm text-slate-500">{delivery.address}</p><p className="mt-2 text-xs font-medium text-slate-400">{delivery.id} · {formatTime(delivery.createdAt)}</p></div><p className="hidden self-center text-sm text-slate-500 sm:block">{delivery.itemDescription}</p><div className="self-center text-right"><StatusPill status={delivery.status} /><p className="mt-2 text-xs font-semibold text-blue-600">View details →</p></div></button>)}{visible.length === 0 && <div className="p-10 text-center"><p className="font-semibold text-slate-700">No deliveries yet</p><p className="mt-1 text-sm text-slate-500">Create a delivery request to begin tracking it here.</p></div>}</div></section><Details delivery={selected} /></div></>}</main></div>
}

function Metric({ label, value, hint, color }) { return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></div> }
function DeliveryForm({ form, setForm, onSubmit, onCancel }) { const fields = [['customerName', 'Customer name', 'e.g. Amina Wanjiku'], ['phone', 'Phone number', 'e.g. 0712 345 678']]; return <form onSubmit={onSubmit} className="max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"><div className="mb-7"><h2 className="text-xl font-bold">New delivery request</h2><p className="mt-1 text-sm text-slate-500">Add the delivery details. This request will be stored safely in your current browser.</p></div><div className="grid gap-5 sm:grid-cols-2">{fields.map(([name, label, placeholder]) => <label key={name} className="block text-sm font-semibold text-slate-700">{label}<input required value={form[name]} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>)}<TextArea label="Delivery address" name="address" placeholder="Building, street, area, city" rows="2" form={form} setForm={setForm} /><TextArea label="Item description" name="itemDescription" placeholder="Describe what the rider will collect and deliver" rows="3" form={form} setForm={setForm} /></div><div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-6"><button type="button" onClick={onCancel} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Create delivery</button></div></form> }
function TextArea({ label, name, placeholder, rows, form, setForm }) { return <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">{label}<textarea required rows={rows} value={form[name]} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 font-normal outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label> }
function Details({ delivery }) { if (!delivery) return <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="font-semibold">Delivery details</p><p className="mt-2 text-sm text-slate-500">Select a delivery to view its timeline.</p></aside>; return <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:sticky xl:top-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-wider text-slate-400">DELIVERY DETAILS</p><h2 className="mt-1 text-lg font-bold">{delivery.id}</h2></div><StatusPill status={delivery.status} /></div><div className="mt-6 space-y-4 border-y border-slate-100 py-5"><Info label="Customer">{delivery.customerName}<br /><span className="font-normal text-slate-500">{delivery.phone}</span></Info><Info label="Delivery address">{delivery.address}</Info><Info label="Items">{delivery.itemDescription}</Info></div><h3 className="mt-6 text-sm font-bold">Delivery timeline</h3><ol className="mt-4 space-y-4 border-l-2 border-slate-100 pl-5">{delivery.timeline.map((event, index) => <li key={`${event.label}-${event.at}`} className="relative"><span className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${index === delivery.timeline.length - 1 ? 'bg-blue-600' : 'bg-slate-300'}`} /><p className="text-sm font-medium text-slate-800">{event.label}</p><p className="mt-0.5 text-xs text-slate-400">{formatTime(event.at)}</p></li>)}</ol></aside> }
function Info({ label, children }) { return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm leading-6 text-slate-700">{children}</p></div> }

export default App
