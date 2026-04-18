import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  user: User | null;
}

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return { user };
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
