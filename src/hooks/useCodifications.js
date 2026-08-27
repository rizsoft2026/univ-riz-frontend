import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1'}/codifications`;

export const useCodifications = () => {
  return useQuery({
    queryKey: ['codifications'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.codification_id ? item.codification_id.toString() : item.id,
        code: item.codification_code,
        category: item.codification_name,
        subjectGroupId: item.bucket_subject_group_id ? item.bucket_subject_group_id.toString() : (item.bucket_subject_group?.bucket_subject_group_id?.toString() || ''),
        subjectGroup: item.bucket_subject_group ? {
          id: item.bucket_subject_group.bucket_subject_group_id?.toString(),
          code: item.bucket_subject_group.subject_group_code,
          name: item.bucket_subject_group.subject_group_name
        } : null,
        description: '', // Backend doesn't support description
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateCodification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCodification) => {
      const payload = {
        codification_code: newCodification.code,
        codification_name: newCodification.category,
        bucket_subject_group_ids: newCodification.subjectGroupIds || [],
        status: newCodification.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codifications'] });
    },
  });
};

export const useUpdateCodification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (codificationData) => {
      const payload = {
        codification_code: codificationData.code,
        codification_name: codificationData.category,
        bucket_subject_group_ids: codificationData.subjectGroupIds || [],
        status: codificationData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${codificationData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codifications'] });
    },
  });
};

export const useDeleteCodification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codifications'] });
    },
  });
};
