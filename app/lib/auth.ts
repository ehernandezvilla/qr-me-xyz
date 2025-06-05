// /lib/auth.ts

export interface UserData {
  username: string;
  password: string;
  token: string;
  correlativo: string;
}

export const users: UserData[] = [
  {
    username: 'zoa',
    password: process.env.NEXT_PUBLIC_USER_ZOA_PASSWORD || '',
    token: process.env.NEXT_PUBLIC_USER_ZOA_TOKEN || '',
    correlativo: process.env.NEXT_PUBLIC_USER_ZOA_CORRELATIVO || '',
  },
  {
    username: 'marketing',
    password: process.env.NEXT_PUBLIC_USER_MARKETING_PASSWORD || '',
    token: process.env.NEXT_PUBLIC_USER_MARKETING_TOKEN || '',
    correlativo: process.env.NEXT_PUBLIC_USER_MARKETING_CORRELATIVO || '',
  },
  // Puedes agregar más usuarios aquí
];

export function login(username: string, password: string): boolean {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr-user', user.username);
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('qr-user');
  }
}

export function getCurrentUser(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('qr-user');
  }
  return null;
}
