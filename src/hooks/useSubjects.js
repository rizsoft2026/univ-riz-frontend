import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1'}/subjects`;

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.subject_id ? item.subject_id.toString() : item.id,
        code: item.subject_code,
        name: item.subject_name,
        subject_group_id: item.bucket_subject_group_id ? item.bucket_subject_group_id.toString() : item.subject_group_id,
        codification_id: item.codification_id ? item.codification_id.toString() : null,
        type: item.subject_type,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSubject) => {
      const payload = {
        subject_code: newSubject.code,
        subject_name: newSubject.name,
        subject_type: newSubject.type,
        bucket_subject_group_id: newSubject.subject_group_id,
        codification_id: newSubject.codification_id,
        status: newSubject.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectData) => {
      const payload = {
        subject_code: subjectData.code,
        subject_name: subjectData.name,
        subject_type: subjectData.type,
        bucket_subject_group_id: subjectData.subject_group_id,
        codification_id: subjectData.codification_id,
        status: subjectData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${subjectData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};
