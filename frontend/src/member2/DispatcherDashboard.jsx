// src/member2/DispatcherDashboard.jsx
import React, { useState } from 'react';
import { initialDeliveries, initialRiders } from '../shared/mockData';

export default function DispatcherDashboard() {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [riders, setRiders] = useState(initialRiders);
  const [filter, setFilter] = useState('ALL'); 
  const [assigningDelivery, setAssigningDelivery] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  const filteredDeliveries = filter === 'ALL' ? deliveries : deliveries.filter(d => d.status === filter);

  // --- Rider Assignment Logic ---
  const handleAssignRider = (riderId) => {
    const rider = riders.find(r => r.id === riderId);
    setDeliveries(deliveries.map(d => {
      if (d.id === assigningDelivery.id) {
        return { 
          ...d, 
          status: 'ASSIGNED', 
          assignedRiderId: riderId,
          timeline: [...d.timeline, { event: `Rider Assigned (${rider.name})`, timestamp: new Date().toISOString() }]
        };
      }
      return d;
    }));
    // Update workload
    setRiders(riders.map(r => r.id === riderId ? { ...r, activeWorkload: r.activeWorkload + 1 } : r));
    setAssigningDelivery(null);
  };

  // --- Edge Case 2: Correcting Wrong Address ---
  const handleEditAddress = (newAddress) => {
    setDeliveries(deliveries.map(d => {
      if (d.id === editingAddress.id) {
        return { 
          ...d, 
          address: newAddress, 
          status: 'NEW', // Reset to NEW for reassignment
          failureReason: null,
          timeline: [...d.timeline, { event: `Address Corrected by Dispatcher`, timestamp: new Date().toISOString() }]
        };
      }
      return d;
    }));
    setEditingAddress(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dispatcher Dashboard</h2>

      {/* --- Filtering (Should Have) --- */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', 'NEW', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'DELIVERY_FAILED'].map(status => (
          <button 
            key={status} 
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded whitespace-nowrap ${filter === status ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-100'}`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* --- Rider Workload Indicator (Sidebar/Widget) --- */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-2">Rider Workload Indicator</h3>
        <div className="flex gap-4">
          {riders.map(rider => (
            <div key={rider.id} className={`px-3 py-1 rounded text-sm ${rider.activeWorkload > 4 ? 'bg-red-100 text-red-800' : rider.activeWorkload > 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {rider.name} — {rider.activeWorkload} active
            </div>
          ))}
        </div>
      </div>

      {/* --- Deliveries List --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDeliveries.map(del => (
              <tr key={del.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{del.id}</div>
                  <div className="text-gray-500 text-xs">{del.customerName}</div>
                </td>
                <td className="px-4 py-3 text-sm">{del.address}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${del.status === 'DELIVERY_FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {del.status}
                  </span>
                  {del.failureReason && <div className="text-red-600 text-xs mt-1">Reason: {del.failureReason}</div>}
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  {/* Edge Case 5: Prevent duplicate assignment */}
                  {del.status === 'NEW' && (
                    <button onClick={() => setAssigningDelivery(del)} className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">Assign Rider</button>
                  )}
                  {/* Edge Case 2: Fix wrong address */}
                  {del.status === 'DELIVERY_FAILED' && del.failureReason === 'Wrong address' && (
                    <button onClick={() => setEditingAddress(del)} className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700">Edit Address & Retry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modals --- */}
      {assigningDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Assign Rider to {assigningDelivery.id}</h3>
            <div className="space-y-2">
              {riders.map(rider => (
                <button 
                  key={rider.id} 
                  onClick={() => handleAssignRider(rider.id)}
                  className="w-full text-left p-3 border rounded hover:bg-blue-50 flex justify-between"
                >
                  <span>{rider.name}</span>
                  <span className="text-sm text-gray-500">{rider.activeWorkload} active</span>
                </button>
              ))}
            </div>
            <button onClick={() => setAssigningDelivery(null)} className="mt-4 w-full text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      {editingAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">Correct Address for {editingAddress.id}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditAddress(e.target.newAddress.value); }}>
              <input name="newAddress" defaultValue={editingAddress.address} className="w-full border p-2 rounded mb-4" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Save & Reset to NEW</button>
            </form>
            <button onClick={() => setEditingAddress(null)} className="mt-2 w-full text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}