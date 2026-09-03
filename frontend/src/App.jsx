import { useState } from 'react'
import Layout from './shared/Layout.jsx'
import RetailerDashboard from './member1/RetailerDashboard.jsx'
import DispatcherDashboard from './member2/DispatcherDashboard.jsx'
import RiderDashboard from './rider/RiderDashboard.jsx'
import { getTeamMembers, selectMember } from './services/api.js'

const roles = [
  {
    key: 'retailer',
    title: 'Retailer',
    description: 'Create and follow up on every customer delivery.',
    icon: 'R',
    color: 'bg-blue-600',
  },
  {
    key: 'dispatcher',
    title: 'Dispatcher',
    description: 'Assign open deliveries and manage your riders.',
    icon: 'D',
    color: 'bg-violet-600',
  },
  {
    key: 'rider',
    title: 'Rider',
    description: 'View jobs and update delivery progress.',
    icon: 'R',
    color: 'bg-emerald-600',
  },
]

function RolePicker({ error, onChoose, selectingRole }) {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 text-2xl font-black">R</div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">
            Delivery coordination, simplified
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Welcome to Reflex</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
            Choose your workspace to get started. Every delivery stays visible from request to confirmation.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => onChoose(role.key)}
              disabled={Boolean(selectingRole)}
              className="group rounded-3xl border border-slate-800 bg-slate-900 p-7 text-left transition hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800"
            >
              <span className={`mb-12 grid h-12 w-12 place-items-center rounded-2xl text-xl font-bold ${role.color}`}>
                {role.icon}
              </span>
              <h2 className="text-xl font-bold">{role.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{role.description}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-blue-300 group-hover:text-white">
                {selectingRole === role.key ? 'Opening workspace…' : 'Open workspace →'}
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p className="mx-auto mt-6 max-w-xl rounded-xl bg-rose-950 px-4 py-3 text-center text-sm text-rose-200">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}

function App() {
  const [role, setRole] = useState(null)
  const [selectingRole, setSelectingRole] = useState(null)
  const [selectionError, setSelectionError] = useState('')

  const chooseRole = async (nextRole) => {
    try {
      setSelectingRole(nextRole)
      setSelectionError('')

      const members = await getTeamMembers(nextRole.toUpperCase())
      const member = members.find(
        (candidate) => candidate.name === `Demo ${nextRole[0].toUpperCase()}${nextRole.slice(1)}`,
      ) || members[0]

      if (!member) {
        throw new Error(`No active ${nextRole} team member is configured.`)
      }

      await selectMember(member.id)
      setRole(nextRole)
    } catch (error) {
      setSelectionError(error.message)
    } finally {
      setSelectingRole(null)
    }
  }

  if (!role) {
    return (
      <RolePicker
        error={selectionError}
        onChoose={chooseRole}
        selectingRole={selectingRole}
      />
    )
  }

  const dashboard = {
    retailer: <RetailerDashboard />,
    dispatcher: <DispatcherDashboard />,
    rider: <RiderDashboard />,
  }[role]

  return (
    <Layout
      currentRole={role}
      error={selectionError}
      onRoleChange={chooseRole}
      selectingRole={selectingRole}
    >
      {dashboard}
    </Layout>
  )
}

export default App
