// TODO: implement API wrapper for backend endpoints
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

export default api;
