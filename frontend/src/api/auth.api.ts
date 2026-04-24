import api from './axios';
import type { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../types/auth.types';
import type { ApiResponse } from '../types/api.types';

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post('/auth/reset-password', data),
};
