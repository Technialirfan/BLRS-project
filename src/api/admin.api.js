import api from './axios';

// Add any admin-specific API calls here (e.g., getting users, dispute logs, etc.)
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/admin/stats'); // If such endpoint exists
  return response.data;
};
