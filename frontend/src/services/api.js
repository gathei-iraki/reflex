const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function readJson(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error(
      `API returned ${contentType || 'an unknown content type'} instead of JSON (${response.status})`,
    )
  }

  return response.json()
}

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
    const data = await readJson(response).catch(() => ({}))
    throw new Error(data.detail || 'Request failed')
  }

  return response.status === 204 ? null : readJson(response)
}

export const getTeamMembers = (role) =>
  request(`/team-members/${role ? `?role=${encodeURIComponent(role)}` : ''}`)

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

export const getFailedDeliveries = () =>
  request('/deliveries/?status=DELIVERY_FAILED')

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

export const markDelivered = (deliveryId, confirmationCode) =>
  request(`/deliveries/${deliveryId}/complete/`, {
    method: 'POST',
    body: JSON.stringify({ confirmation_code: confirmationCode }),
  })

export const markFailed = (deliveryId, failureReason, failureNotes) =>
  request(`/deliveries/${deliveryId}/fail/`, {
    method: 'POST',
    body: JSON.stringify({
      failure_reason: failureReason,
      failure_notes: failureNotes,
    }),
  })
