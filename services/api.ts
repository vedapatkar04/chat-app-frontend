
import axios from 'axios';

// Replace with your Hostinger backend URL
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
console.log("Backend URL:", import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// Helper to set auth token in local storage
export const setAuth = (userId: string, token: string, email: string) => {
  localStorage.setItem('userId', userId);
  localStorage.setItem('authToken', token);
  localStorage.setItem('email', email);
};

export const getAuth = () => {
  return {
    userId: localStorage.getItem('userId'),
    authToken: localStorage.getItem('authToken'),
    email: localStorage.getItem('email'),
  };
};

export const clearAuth = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('authToken');
  localStorage.removeItem('email');
};
