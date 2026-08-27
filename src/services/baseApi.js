import axios from "axios";

const baseApi = axios.create({
  baseURL: import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1',
  headers: {
    "Content-Type": "application/json",
  },
});

export default baseApi;
