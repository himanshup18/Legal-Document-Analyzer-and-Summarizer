import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://legal-document-analyzer-and-summarizer.onrender.com/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
    const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        ...getAuthHeader(),
      },
    });
    return response.data;
  } catch (error) {
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

export const updateHighlightNote = async (documentId, highlightIndex, note) => {
  const response = await api.patch(`/documents/${documentId}/highlights/${highlightIndex}`, { note });
  return response.data;
};

export default api;
