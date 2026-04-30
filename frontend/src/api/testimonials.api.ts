import api from './axios';
import type { ApiResponse } from '../types/api.types';

export interface TestimonialAuthor {
  firstName: string;
  lastName: string;
  country: string | null;
  avatarUrl: string | null;
}

export interface Testimonial {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  author: TestimonialAuthor;
}

export interface MyTestimonial {
  id: string;
  userId: string;
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestimonialEligibility {
  eligible: boolean;
  hasTestimonial: boolean;
}

export interface CreateTestimonialPayload {
  content: string;
  rating: number;
}

export const testimonialsApi = {
  list: () => api.get<ApiResponse<Testimonial[]>>('/testimonials'),
  mine: () => api.get<ApiResponse<MyTestimonial | null>>('/testimonials/me'),
  eligibility: () => api.get<ApiResponse<TestimonialEligibility>>('/testimonials/eligibility'),
  create: (data: CreateTestimonialPayload) =>
    api.post<ApiResponse<MyTestimonial>>('/testimonials', data),
  remove: (id: string) => api.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/testimonials/${id}`),
};
