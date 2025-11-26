export interface User {
  id: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  phone: string;
}

export interface VerifyCredentials {
  phone?: string;
  email?: string;
  code: string;
}

export interface EmailLoginCredentials {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  user?: any;
  session?: any;
}
