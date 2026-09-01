import api from './api'

export interface RegisterUserRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface UserResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export async function registerUser(payload: RegisterUserRequest): Promise<UserResponse> {
  const resp = await api.post('/api/identity/register', payload)
  return resp.data as UserResponse
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const resp = await api.post('/api/identity/login', payload)
  return resp.data as LoginResponse
}

export async function getCurrentUser(): Promise<UserResponse> {
  const resp = await api.get('/api/identity/me')
  return resp.data as UserResponse
}
