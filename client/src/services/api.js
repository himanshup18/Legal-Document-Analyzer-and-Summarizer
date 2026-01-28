import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type for multipart/form-data - let axios set it automatically
});

export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

export const getDocument = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  try {
    // Let axios automatically set Content-Type with boundary - don't set it manually
    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData);
    return response.data;
  } catch (error) {
    // Extract error message from response
    const errorMessage = error.response?.data?.error || error.message || 'Failed to upload document';
    throw new Error(errorMessage);
  }
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const reanalyzeDocument = async (id) => {
  const response = await api.post(`/documents/${id}/analyze`);
  return response.data;
};

export default api;
