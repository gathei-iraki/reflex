export default function Layout({ children, currentRole, onRoleChange }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-blue-600">Reflex MVP</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRoleChange('retailer')}
              className={`rounded px-3 py-1 ${currentRole === 'retailer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Retailer
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('dispatcher')}
              className={`rounded px-3 py-1 ${currentRole === 'dispatcher' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Dispatcher
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('rider')}
              className={`rounded px-3 py-1 ${currentRole === 'rider' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Rider
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
