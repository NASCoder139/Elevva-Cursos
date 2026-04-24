export interface Interest {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
