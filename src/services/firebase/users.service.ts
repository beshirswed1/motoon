import { collection, doc, getDoc, getDocs, updateDoc, query, where, orderBy, limit, startAfter, Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { User } from '../../types/user.types';

const COLLECTION = 'users';

export const usersService = {
  getProfile: async (userId: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, COLLECTION, userId));
    if (!userDoc.exists()) return null;
    const userData = userDoc.data() as User;
    if (userData.isDeleted) return null;
    return userData;
  },

  updateProfile: async (userId: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'role'>>): Promise<void> => {
    const userRef = doc(db, COLLECTION, userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  // Admin Query
  getAllUsers: async (filters?: { role?: string, lastDoc?: DocumentSnapshot, pageSize?: number }): Promise<{ users: User[], lastDoc: DocumentSnapshot | null }> => {
    let q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
    
    if (filters?.role) {
      q = query(q, where('role', '==', filters.role));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const pageSize = filters?.pageSize || 20;
    q = query(q, limit(pageSize));

    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc));
    }

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => doc.data() as User);
    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { users, lastDoc };
  },

  softDelete: async (userId: string, deletedBy: string): Promise<void> => {
    const userRef = doc(db, COLLECTION, userId);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
      deletedBy,
      updatedAt: Timestamp.now()
    });
  }
};
