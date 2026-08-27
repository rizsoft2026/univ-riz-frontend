import axios from "axios";

const baseApi = axios.create({
  baseURL: import.meta.env.PROD ? 'https://sduerpback.rizsoftware.co.in/api/v1' : 'http://localhost:5000/api/v1',
  headers: {
    "Content-Type": "application/json",
  },
});

export default baseApi;
