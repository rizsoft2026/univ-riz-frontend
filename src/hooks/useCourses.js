import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.PROD ? 'https://backend.univriz.com/api/v1' : 'http://localhost:5000/api/v1'}/courses`;

export const useCourses = (facultyId = null, excludeCourseId = null) => {
  return useQuery({
    queryKey: ['courses', facultyId, excludeCourseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (facultyId) params.append('faculty_id', facultyId);
      if (excludeCourseId) params.append('exclude_course_id', excludeCourseId);
      
      const url = params.toString() ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;
      const response = await axios.get(url);
      const data = response.data.data || [];
      return data.map(item => ({
        id: item.course_id ? item.course_id.toString() : item.id,
        code: item.course_code,
        name: item.course_name,
        course_full_name: item.course_full_name,
        subject_group_id: item.bucket_subject_group_id ? item.bucket_subject_group_id.toString() : item.subject_group_id,
        faculty_id: item.faculty_id ? item.faculty_id.toString() : null,
        faculty: item.faculty,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    },
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCourse) => {
      const payload = {
        course_code: newCourse.code,
        course_name: newCourse.name,
        course_full_name: newCourse.course_full_name,
        bucket_subject_group_id: newCourse.subject_group_id,
        faculty_id: newCourse.faculty_id || null,
        status: newCourse.status
      };
      const response = await axios.post(API_BASE_URL, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseData) => {
      const payload = {
        course_code: courseData.code,
        course_name: courseData.name,
        course_full_name: courseData.course_full_name,
        bucket_subject_group_id: courseData.subject_group_id,
        faculty_id: courseData.faculty_id !== undefined ? (courseData.faculty_id || null) : undefined,
        status: courseData.status
      };
      const response = await axios.put(`${API_BASE_URL}/${courseData.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
