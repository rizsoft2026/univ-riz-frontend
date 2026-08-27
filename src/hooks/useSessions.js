import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://sduerpback.rizsoftware.co.in/api/v1' : 'http://localhost:5000/api/v1'}/sessions`;

export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map((s) => ({
        id: s.session_id.toString(),
        fromYear: s.from_year,
        toYear: s.to_year,
        sessionYear: s.session_year,
        duration: s.duration,
        status: s.status,
        createdAt: s.created_at || new Date().toISOString(),
      }));
    },
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSession) => {
      const response = await axios.post(API_BASE_URL, newSession);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axios.put(`${API_BASE_URL}/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
