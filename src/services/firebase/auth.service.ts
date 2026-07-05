import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { User, UserRole } from '../../types/user.types';

export const getCurrentUserRole = async (uid: string): Promise<UserRole> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data().role as UserRole;
  }
  return 'user'; // default fallback
};

// Helper to sync cookies for Next.js middleware
export const syncAuthCookies = (isAuthenticated: boolean, role: string = '') => {
  if (typeof document !== 'undefined') {
    document.cookie = `isAuthenticated=${isAuthenticated}; path=/; max-age=${isAuthenticated ? 60*60*24*7 : 0}`;
    document.cookie = `role=${role}; path=/; max-age=${isAuthenticated ? 60*60*24*7 : 0}`;
  }
};

export const register = async (email: string, password: string, name: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;
  
  const newUser: User = {
    id: fbUser.uid,
    name,
    email,
    role: 'user',
    avatarUrl: '',
    provider: 'password',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastLogin: Timestamp.now(),
    emailVerified: fbUser.emailVerified,
    disabled: false,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };

  await setDoc(doc(db, 'users', fbUser.uid), newUser);
  syncAuthCookies(true, 'user');
  return newUser;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = userCredential.user;
  
  const userDocRef = doc(db, 'users', fbUser.uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    throw new Error('لم يتم العثور على ملف مستخدم مطابق في قاعدة البيانات.');
  }
  
  const userData = userDoc.data() as User;
  if (userData.disabled || userData.isDeleted) {
    await firebaseSignOut(auth);
    throw new Error('تم تعطيل هذا الحساب من قبل الإدارة.');
  }

  // Update lastLogin
  await updateDoc(userDocRef, {
    lastLogin: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  userData.lastLogin = Timestamp.now();

  syncAuthCookies(true, userData.role);
  return userData;
};

export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const fbUser = userCredential.user;
  
  const userDocRef = doc(db, 'users', fbUser.uid);
  const userDoc = await getDoc(userDocRef);
  let userData: User;
  
  if (!userDoc.exists()) {
    userData = {
      id: fbUser.uid,
      name: fbUser.displayName || 'مستخدم جوجل',
      email: fbUser.email || '',
      role: 'user',
      avatarUrl: fbUser.photoURL || '',
      provider: 'google.com',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      emailVerified: fbUser.emailVerified,
      disabled: false,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
    await setDoc(userDocRef, userData);
  } else {
    userData = userDoc.data() as User;
    if (userData.disabled || userData.isDeleted) {
      await firebaseSignOut(auth);
      throw new Error('تم تعطيل هذا الحساب من قبل الإدارة.');
    }
    // Update lastLogin
    await updateDoc(userDocRef, {
      lastLogin: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    userData.lastLogin = Timestamp.now();
  }
  
  syncAuthCookies(true, userData.role);
  return userData;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
  syncAuthCookies(false);
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  let unsubscribeSnapshot: (() => void) | null = null;

  const unsubscribeAuth = firebaseOnAuthStateChanged(auth, async (fbUser) => {
    // Unsubscribe from previous user document listener if any
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (fbUser) {
      const userRef = doc(db, 'users', fbUser.uid);
      unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          if (userData.isDeleted) {
            // Force sign out if deleted
            firebaseSignOut(auth);
            syncAuthCookies(false);
            callback(null);
          } else {
            syncAuthCookies(true, userData.role);
            callback(userData);
          }
        } else {
          // Document doesn't exist yet (e.g. registration in progress)
          syncAuthCookies(false);
          callback(null);
        }
      }, (error) => {
        console.error("Error listening to user document changes:", error);
        callback(null);
      });
    } else {
      syncAuthCookies(false);
      callback(null);
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};
