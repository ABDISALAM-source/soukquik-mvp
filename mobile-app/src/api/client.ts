import axios from 'axios';
import { useSession } from '../store/session';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useSession.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Décompresse { success, data, error } automatiquement
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.error || err.message || 'Erreur réseau';
    return Promise.reject(new Error(message));
  }
);
