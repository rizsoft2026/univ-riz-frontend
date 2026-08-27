import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://sduerpback.rizsoftware.co.in/api/v1' : 'http://localhost:5000/api/v1'}/specializations`;

export const useSpecializations = () => {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.specialization_id ? item.specialization_id.toString() : item.id,
        code: item.specialization_code,
        name: item.specialization_name,
        description: item.description,
        course_id: item.course_id ? item.course_id.toString() : null,
        course: item.course ? {
          code: item.course.course_code,
          name: item.course.course_name,
          status: item.course.status
        } : null,
        subjects: item.specialization_subject_mappings ? item.specialization_subject_mappings.map(m => ({
          id: m.subject.subject_id.toString(),
          code: m.subject.subject_code,
          name: m.subject.subject_name
        })) : [],
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateSpecialization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSpec) => {
      const payload = {
        course_id: newSpec.courseId,
        code: newSpec.code,
        specializations: newSpec.specializations,
        status: newSpec.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

export const useUpdateSpecialization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (specData) => {
      const payload = {
        specialization_code: specData.code,
        specialization_name: specData.name,
        description: specData.description,
        course_id: specData.courseId,
        subject_ids: specData.subjectIds,
        status: specData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${specData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};

export const useDeleteSpecialization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
  });
};
