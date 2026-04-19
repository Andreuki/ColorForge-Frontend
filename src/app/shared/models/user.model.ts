export interface User {
  _id: string;
  id?: number | string;
  name: string;
  username?: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  forgeScore: number;
  forgeTier:
    | 'Aprendiz de Forja'
    | 'Pintor de Batalla'
    | 'Maestro Herrero'
    | 'Gran Maestro de la Forja';
  badges: string[];
  following: string[];
  followers: string[];
  isBlocked: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Usuario';
  return user.name ?? user.username ?? 'Usuario';
}

export function getUserId(user: User | null | undefined): string {
  if (!user) return '';
  if (user.id !== undefined && user.id !== null) return String(user.id);
  return user._id ?? '';
}
