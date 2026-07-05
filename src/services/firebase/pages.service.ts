import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Page } from '../../types/admin.types';

const COLLECTION = 'pages';

export const pagesService = {
  getAll: async (): Promise<Page[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Page);
  },

  getBySlug: async (slug: string): Promise<Page | null> => {
    const q = query(
      collection(db, COLLECTION),
      where('slug', '==', slug),
      where('isDeleted', '==', false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Page;
  },

  create: async (page: Omit<Page, 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): Promise<void> => {
    const pageRef = doc(db, COLLECTION, page.id);
    const newPage: Page = {
      ...page,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    };
    await setDoc(pageRef, newPage);
  },

  update: async (id: string, data: Partial<Omit<Page, 'id' | 'createdAt'>>): Promise<void> => {
    const pageRef = doc(db, COLLECTION, id);
    await updateDoc(pageRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  softDelete: async (id: string, deletedBy: string): Promise<void> => {
    const pageRef = doc(db, COLLECTION, id);
    await updateDoc(pageRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
      deletedBy,
      updatedAt: Timestamp.now()
    });
  }
};
