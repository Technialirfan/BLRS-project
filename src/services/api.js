let BASE_URL = import.meta.env.VITE_API_URL || 'https://blrs-backend.vercel.app';
if (BASE_URL.endsWith('/')) {
  BASE_URL = BASE_URL.slice(0, -1);
}

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('blrs_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  delete config.headers['Content-Type'];
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('blrs_token');
      localStorage.removeItem('blrs_officer');
      window.location.href = '/login';
      return;
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
};

export const authAPI = {
  login: (email, password) =>
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  logout: () =>
    apiCall('/api/auth/logout', { method: 'POST' }),
  getMe: () =>
    apiCall('/api/auth/me'),
  updateProfile: (data) =>
    apiCall('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiCall('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    })
};

export const landAPI = {
  register: (landData) =>
    apiCall('/api/land/register', {
      method: 'POST',
      body: JSON.stringify(landData)
    }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/land/all${query ? '?' + query : ''}`);
  },
  getOne: (parcelId) =>
    apiCall(`/api/land/${parcelId}`),
  updateSurvey: (id, payload) =>
    apiCall(`/api/land/${id}/survey`, { method: 'PUT', body: JSON.stringify(payload) }),
  update: (parcelId, data) =>
    apiCall(`/api/land/${parcelId}`, { 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
  delete: (parcelId) =>
    apiCall(`/api/land/${parcelId}`, { method: 'DELETE' }),
  verify: (parcelId) =>
    apiCall(`/api/land/${parcelId}/verify`, { method: 'PUT' }),
  approve: (parcelId) =>
    apiCall(`/api/land/${parcelId}/approve`, { method: 'PUT' }),
  reject: (parcelId, reason) =>
    apiCall(`/api/land/${parcelId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),
  revoke: (parcelId, reason) =>
    apiCall(`/api/land/${parcelId}/revoke`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),
  initiateTransfer: (parcelId, transferData) =>
    apiCall(`/api/land/${parcelId}/transfer/initiate`, {
      method: 'POST',
      body: JSON.stringify(transferData)
    }),
  approveTransfer: (parcelId) =>
    apiCall(`/api/land/${parcelId}/transfer/approve`, { method: 'PUT' }),
  rejectTransfer: (parcelId, reason) =>
    apiCall(`/api/land/${parcelId}/transfer/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    }),
  getHistory: (parcelId) =>
    apiCall(`/api/land/${parcelId}/history`),
  getDashboardStats: () =>
    apiCall('/api/land/stats/dashboard')
};

export const disputeAPI = {
  file: (formData) =>
    apiCall('/api/disputes/file', {
      method: 'POST',
      body: formData
    }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/disputes/all${query ? '?' + query : ''}`);
  },
  getOne: (id) =>
    apiCall(`/api/disputes/${id}`),
  review: (id) =>
    apiCall(`/api/disputes/${id}/review`, { method: 'PUT' }),
  markUnderReview: (id) =>
    apiCall(`/api/disputes/${id}/review`, { method: 'PUT' }),
  resolve: (id, resolution) =>
    apiCall(`/api/disputes/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution })
    }),
  reject: (id, reason) =>
    apiCall(`/api/disputes/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    })
};

export const documentAPI = {
  upload: async (file) => {
    const token = localStorage.getItem('blrs_token');
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return { ok: response.ok, data: await response.json() };
  }
};

export const adminAPI = {
  getOfficers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/admin/officers${query ? '?' + query : ''}`);
  },
  createOfficer: (officerData) =>
    apiCall('/api/admin/officers/create', {
      method: 'POST',
      body: JSON.stringify(officerData)
    }),
  toggleOfficer: (id) =>
    apiCall(`/api/admin/officers/${id}/toggle`, { method: 'PUT' }),
  updateEmploymentStatus: (id, status) =>
    apiCall(`/api/admin/officers/${id}/employment-status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  resetOfficerPassword: (id) =>
    apiCall(`/api/admin/officers/${id}/reset-password`, { method: 'PUT' }),
  updateDistrict: (id, assignedDistrict) =>
    apiCall(`/api/admin/officers/${id}/district`, {
      method: 'PUT',
      body: JSON.stringify({ assignedDistrict })
    }),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/admin/audit-logs${query ? '?' + query : ''}`);
  },
  exportAuditLogs: async (params = {}) => {
    const token = localStorage.getItem('blrs_token');
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/api/admin/audit-logs/export${query ? '?' + query : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to export logs");
    return response.blob();
  },
  getStats: () =>
    apiCall('/api/admin/stats')
};

export const publicAPI = {
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/public/search?${query}`);
  },
  getLand: (parcelId) =>
    apiCall(`/api/public/land/${parcelId}`),
  getAllGIS: () =>
    apiCall('/api/public/gis'),
  getStats: () =>
    apiCall('/api/public/stats')
};



export default apiCall;
