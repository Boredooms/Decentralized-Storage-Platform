import { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const authContext: AuthContextType = {
    user,
    isLoading: !isLoaded,
    isAuthenticated: !!user && isLoaded,
    signIn: () => {
      // Clerk handles sign-in through UI components
      window.location.href = '/sign-in';
    },
    signOut: () => signOut(),
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}