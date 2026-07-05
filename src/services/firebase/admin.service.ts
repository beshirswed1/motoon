import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const adminService = {
  getPlatformStats: async () => {
    const usersQuery = query(collection(db, 'users'), where('isDeleted', '==', false));
    const booksQuery = query(collection(db, 'books'), where('isDeleted', '==', false));
    const sessionsQuery = query(collection(db, 'recitation_sessions'), where('isDeleted', '==', false));

    const [usersCount, booksCount, sessionsCount] = await Promise.all([
      getCountFromServer(usersQuery),
      getCountFromServer(booksQuery),
      getCountFromServer(sessionsQuery)
    ]);

    return {
      totalUsers: usersCount.data().count,
      totalBooks: booksCount.data().count,
      totalSessions: sessionsCount.data().count
    };
  }
};
