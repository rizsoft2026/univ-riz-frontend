import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import baseApi from '../services/baseApi';

export const useStudentCurriculumMappings = () => {
  return useQuery({
    queryKey: ['student-curriculum-mappings'],
    queryFn: async () => {
      try {
        const res = await baseApi.get('/student-curriculum-mappings');
        return res.data?.data || [];
      } catch (err) {
        console.error('Error fetching student curriculum mappings:', err);
        return [];
      }
    },
  });
};

export const useSaveStudentCurriculumMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await baseApi.post('/student-curriculum-mappings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-curriculum-mappings'] });
    },
  });
};

export const useDeleteStudentCurriculumMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await baseApi.delete(`/student-curriculum-mappings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-curriculum-mappings'] });
    },
  });
};
