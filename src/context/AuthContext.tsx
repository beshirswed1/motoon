'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged as firebaseOnAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { User } from '@/types/user.types';
import { register, signIn, signInWithGoogle, signOut, syncAuthCookies } from '@/services/firebase/auth.service';
import { useAppDispatch } from '@/store/hooks';
import { setUser, clearAuth } from '@/store/slices/authSlice';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: typeof signIn;
  register: typeof register;
  signInWithGoogle: typeof signInWithGoogle;
  signOut: typeof signOut;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [user, setLocalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = firebaseOnAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous Firestore listener if any
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            if (userData.disabled || userData.isDeleted) {
              // Forced sign out if user account is disabled
              firebaseSignOut(auth);
              syncAuthCookies(false);
              setLocalUser(null);
              dispatch(clearAuth());
              setLoading(false);
              setInitialized(true);
            } else {
              syncAuthCookies(true, userData.role);
              setLocalUser(userData);
              dispatch(setUser(userData));
              setLoading(false);
              setInitialized(true);
            }
          } else {
            // User registered in Firebase Auth but doc not written yet
            syncAuthCookies(false);
            setLoading(true);
          }
        }, (error) => {
          console.error("Error watching user document in AuthProvider:", error);
          setLocalUser(null);
          dispatch(clearAuth());
          setLoading(false);
          setInitialized(true);
        });
      } else {
        syncAuthCookies(false);
        setLocalUser(null);
        dispatch(clearAuth());
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [dispatch]);

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    signIn,
    register,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
