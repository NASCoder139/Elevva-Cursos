import api from './axios';
import type { ApiResponse } from '../types/api.types';
import type { User } from '../types/auth.types';
import type { Interest, UpdateProfileRequest, ChangePasswordRequest } from '../types/user.types';

export const usersApi = {
  getMe: () => api.get<ApiResponse<User>>('/users/me'),
  updateProfile: (data: UpdateProfileRequest) => api.patch<ApiResponse<User>>('/users/me', data),
  changePassword: (data: ChangePasswordRequest) => api.patch('/users/me/password', data),
  getInterests: () => api.get<ApiResponse<Interest[]>>('/users/interests'),
  updateInterests: (interestIds: string[]) =>
    api.put<ApiResponse<User>>('/users/me/interests', { interestIds }),
  getAccess: () => api.get('/users/me/access'),
};
