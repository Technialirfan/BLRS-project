import api from './axios';

export const getAllLands = async () => {
  const response = await api.get('/land/all');
  return response.data;
};

export const getLandById = async (parcelId) => {
  const response = await api.get(`/land/${parcelId}`);
  return response.data;
};

// Uses multipart/form-data
export const registerLand = async (formData) => {
  const response = await api.post('/land/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const verifyLand = async (parcelId) => {
  const response = await api.put(`/land/${parcelId}/verify`);
  return response.data;
};

export const approveLand = async (parcelId) => {
  const response = await api.put(`/land/${parcelId}/approve`);
  return response.data;
};
