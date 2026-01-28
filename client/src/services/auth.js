import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const signup = async (name, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
    name,
    email,
    password,
  });
  return response.data;
};

export const signin = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
    email,
    password,
  });
  return response.data;
};

export const getMe = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
