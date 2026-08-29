// src/member1/RetailerDashboard.jsx
import React, { useState } from 'react';
import { initialDeliveries } from '../shared/mockData';

export default function RetailerDashboard() {
  const [deliveries, setDeliveries] = useState(initialDeliveries.filter(d => d.retailerId === 'RET-1'));
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Form State
  const [form, setForm] = useState({ 
    customerName: '', 
    phone: '', 
    address: '', 
    itemDescription: '' 
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const newDelivery = {
      id: `DEL-${Math.floor(Math.random() * 1000)}`,
      retailerId: 'RET-1',
      ...form,
      status: 'NEW',
      assignedRiderId: null,
      failureReason: null,
      timeline: [{ event: 'Delivery Created', timestamp: new Date().toISOString() }]
    };
    setDeliveries([newDelivery, ...deliveries]);
    setForm({ customerName: '', phone: '', address: '', itemDescription: '' });
    setView('list');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Retailer Dashboard</h2>
        <button 
          onClick={() => setView(view === 'create' ? 'list' : 'create')} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {view === 'create' ? 'View My Deliveries' : '+ Create New Delivery'}
        </button>
      </div>

      {view === 'create' ? (
        // --- Delivery Form (Must Have #1) ---
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow max-w-xl space-y-4">
          <h3 className="text-lg font-semibold">New Delivery Request</h3>
          <input 
            type="text" 
            placeholder="Customer Name" 
            required 
            className="w-full border p-2 rounded" 
            value={form.customerName} 
            onChange={e => setForm({...form, customerName: e.target.value})} 
          />
          <input 
            type="tel" 
            placeholder="Phone Number" 
            required 
            className="w-full border p-2 rounded" 
            value={form.phone} 
            onChange={e => setForm({...form, phone: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="Delivery Address" 
            required 
            className="w-full border p-2 rounded" 
            value={form.address} 
            onChange={e => setForm({...form, address: e.target.value})} 
          />
          <textarea 
            placeholder="Item Description" 
            required 
            className="w-full border p-2 rounded" 
            value={form.itemDescription} 
            onChange={e => setForm({...form, itemDescription: e.target.value})} 
          />
          <button 
            type="submit" 
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Submit Request
          </button>
        </form>
      ) : selectedDelivery ? (
        // --- Delivery Details / Timeline UI (Must Have #5) ---
        <div className="bg-white p-6 rounded-lg shadow max-w-xl">
          <button 
            onClick={() => setSelectedDelivery(null)} 
            className="text-blue-600 mb-4"
          >
            &larr; Back to list
          </button>
          <h3 className="text-xl font-bold mb-2">Delivery #{selectedDelivery.id}</h3>
          <p className="text-gray-600 mb-1"><strong>To:</strong> {selectedDelivery.customerName} ({selectedDelivery.phone})</p>
          <p className="text-gray-600 mb-1"><strong>Address:</strong> {selectedDelivery.address}</p>
          <p className="text-gray-600 mb-4"><strong>Items:</strong> {selectedDelivery.itemDescription}</p>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">
              Status: 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                selectedDelivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                selectedDelivery.status === 'DELIVERY_FAILED' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedDelivery.status}
              </span>
            </h4>
            {selectedDelivery.failureReason && (
              <p className="text-red-600 text-sm mb-2">Failure Reason: {selectedDelivery.failureReason}</p>
            )}
            
            <h4 className="font-semibold mt-4 mb-2">Audit Trail / Timeline</h4>
            <ul className="border-l-2 border-gray-200 pl-4 space-y-3">
              {selectedDelivery.timeline.map((event, idx) => (
                <li key={idx} className="relative">
                  <span className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-600 rounded-full"></span>
                  <p className="font-medium">{event.event}</p>
                  <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        // --- Display Retailer's Deliveries List ---
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deliveries.map(del => (
                <tr key={del.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{del.id}</td>
                  <td className="px-4 py-3 text-sm">{del.customerName}</td>
                  <td className="px-4 py-3 text-sm">{del.status}</td>
                  <td className="px-4 py-3 text-sm">
                    <button 
                      onClick={() => setSelectedDelivery(del)} 
                      className="text-blue-600 hover:underline"
                    >
                      View Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}