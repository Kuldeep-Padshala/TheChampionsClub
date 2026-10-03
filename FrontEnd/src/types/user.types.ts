export interface User {
  id: string;
  name: string;
  email: string;
  planId: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
}

