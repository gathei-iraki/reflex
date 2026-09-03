const API_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Request failed')
  }

  return response.status === 204 ? null : response.json()
}

export const getTeamMembers = () => request('/team-members/')

export const selectMember = (memberId) =>
  request('/session/select-member/', {
    method: 'POST',
    body: JSON.stringify({ member_id: memberId }),
  })

export const getDeliveries = () => request('/deliveries/')

export const createDelivery = (form) =>
  request('/deliveries/', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: form.customerName,
      customer_phone: form.phone,
      delivery_address: form.address,
      item_description: form.itemDescription,
    }),
  })
  export const getNewDeliveries = () =>
  request('/deliveries/?status=NEW')

export const getRiderWorkload = () =>
  request('/riders/workload/')

export const assignRider = (deliveryId, riderId) =>
  request(`/deliveries/${deliveryId}/assign/`, {
    method: 'POST',
    body: JSON.stringify({ rider_id: riderId }),
  })
  export const getRiderDeliveries = () =>
  request('/deliveries/')

export const markPickedUp = (deliveryId) =>
  request(`/deliveries/${deliveryId}/pick-up/`, {
    method: 'POST',
  })