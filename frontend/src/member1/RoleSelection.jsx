import React, { useState } from 'react';

const ROLES = [
  {
    role: 'RETAILER',
    title: 'Retailer',
    description: 'Create delivery requests and monitor your deliveries.',
  },
  {
    role: 'DISPATCHER',
    title: 'Dispatcher',
    description: 'Assign riders and manage delivery operations.',
  },
  {
    role: 'RIDER',
    title: 'Rider',
    description: 'View assigned deliveries and update delivery status.',
  },
];

export default function RoleSelection({ members = [], onSelect }) {
  const [selectedRole, setSelectedRole] = useState('RETAILER');

  const availableMembers = members.filter(
    (member) => member.isActive !== false && member.is_active !== false
  );

  const roleMembers = availableMembers.filter(
    (member) => member.role === selectedRole
  );

  const handleSelect = (member) => {
    if (onSelect) onSelect(member);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">Reflex</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Select your role
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Choose the role you want to use for this session.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {ROLES.map((item) => {
            const active = selectedRole === item.role;

            return (
              <button
                key={item.role}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-semibold text-gray-900">
            {ROLES.find((item) => item.role === selectedRole)?.title} members
          </h2>

          {roleMembers.length === 0 ? (
            <p className="mt-5 rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No active {selectedRole.toLowerCase()} members are available.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-gray-100">
              {roleMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left hover:bg-gray-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      {member.name}
                    </span>
                    {member.phone_number && (
                      <span className="mt-1 block text-xs text-gray-500">
                        {member.phone_number}
                      </span>
                    )}
                  </span>
                  <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                    Continue
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
