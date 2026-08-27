import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1'}/course-semester-subject-mappings`;

export const useCurriculumMappings = () => {
  return useQuery({
    queryKey: ['curriculumMappings'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.mapping_id.toString(),
        session_id: item.session_id.toString(),
        course_id: item.course_id.toString(),
        codification_id: item.codification_id ? item.codification_id.toString() : null,
        bucket_subject_group_id: item.bucket_subject_group_id ? item.bucket_subject_group_id.toString() : null,
        semester: item.semester,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateCurriculumMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMapping) => {
      const payload = {
        session_id: newMapping.sessionId,
        course_id: newMapping.courseId,
        codification_id: newMapping.codificationId,
        bucket_subject_group_id: newMapping.bucketSubjectGroupId,
        semester: newMapping.semester,
        status: newMapping.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculumMappings'] });
    },
  });
};

export const useUpdateCurriculumMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappingData) => {
      const payload = {
        session_id: mappingData.sessionId,
        course_id: mappingData.courseId,
        codification_id: mappingData.codificationId,
        bucket_subject_group_id: mappingData.bucketSubjectGroupId,
        semester: mappingData.semester,
        status: mappingData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${mappingData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculumMappings'] });
    },
  });
};

export const useDeleteCurriculumMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculumMappings'] });
    },
  });
};
