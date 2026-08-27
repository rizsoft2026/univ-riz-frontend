import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1'}/faculties`;

export const useFaculties = () => {
  return useQuery({
    queryKey: ['faculties'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.faculty_id ? item.faculty_id.toString() : item.id,
        code: item.faculty_code,
        name: item.faculty_name,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newFaculty) => {
      const payload = {
        faculty_code: newFaculty.code,
        faculty_name: newFaculty.name,
        status: newFaculty.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
    },
  });
};

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (facultyData) => {
      const payload = {
        faculty_code: facultyData.code,
        faculty_name: facultyData.name,
        status: facultyData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${facultyData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
    },
  });
};

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
    },
  });
};
