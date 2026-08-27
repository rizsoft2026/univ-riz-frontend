import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://sduerpback.rizsoftware.co.in/api/v1' : 'http://localhost:5000/api/v1'}/session-course-mappings`;

export const useSessionCourseMappings = () => {
  return useQuery({
    queryKey: ['sessionCourseMappings'],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.mapping_id.toString(),
        session_id: item.session_id.toString(),
        course_id: item.course_id.toString(),
        status: item.status,
        faculty_id: item.faculty_id ? item.faculty_id.toString() : null,
        courseType: item.course_type,
        courseDuration: item.course_duration,
        minor_course_subject_ids: (item.minor_subjects || []).map(ms => ms.minor_course_id.toString()),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateSessionCourseMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMapping) => {
      const payload = {
        session_id: newMapping.sessionId,
        course_id: newMapping.courseId,
        faculty_id: newMapping.facultyId,
        course_type: newMapping.courseType,
        course_duration: newMapping.courseDuration,
        minor_course_subject_ids: newMapping.minorCourseSubjectIds,
        status: newMapping.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionCourseMappings'] });
    },
  });
};

export const useUpdateSessionCourseMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappingData) => {
      const payload = {
        session_id: mappingData.sessionId,
        course_id: mappingData.courseId,
        faculty_id: mappingData.facultyId,
        course_type: mappingData.courseType,
        course_duration: mappingData.courseDuration,
        minor_course_subject_ids: mappingData.minorCourseSubjectIds,
        status: mappingData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${mappingData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionCourseMappings'] });
    },
  });
};

export const useDeleteSessionCourseMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionCourseMappings'] });
    },
  });
};
