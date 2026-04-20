export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface Session {
  userId: string;
  email: string;
  issuedAt: number;
}
