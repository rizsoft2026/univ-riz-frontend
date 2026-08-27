import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://sduerpback.rizsoftware.co.in/api/v1' : 'http://localhost:5000/api/v1'}/bucket-subject-groups`;

export const useSubjectGroups = () => {
  return useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.bucket_subject_group_id ? item.bucket_subject_group_id.toString() : item.id,
        code: item.subject_group_code,
        name: item.subject_group_name,
        description: item.description,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateSubjectGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newGroup) => {
      const payload = {
        subject_group_code: newGroup.code,
        subject_group_name: newGroup.name,
        description: newGroup.description,
        status: newGroup.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
    },
  });
};

export const useUpdateSubjectGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupData) => {
      const payload = {
        subject_group_code: groupData.code,
        subject_group_name: groupData.name,
        description: groupData.description,
        status: groupData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${groupData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
    },
  });
};

export const useDeleteSubjectGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjectGroups'] });
    },
  });
};
