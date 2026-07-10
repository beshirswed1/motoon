import { collection, getDocs, getCountFromServer, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const analyticsService = {
  getTotalStats: async (): Promise<{
    totalUsers: number;
    totalBooks: number;
    totalSessions: number;
    activeUsersToday: number;
  }> => {
    try {
      // Check admin override first
      const statsDoc = await getDoc(doc(db, 'site_settings', 'homepage_stats'));
      if (statsDoc.exists()) {
        const d = statsDoc.data();
        if (d.useRealData === false) {
          return {
            totalUsers: d.totalUsers || 1,
            totalBooks: d.totalBooks || 1,
            totalSessions: d.totalSessions || 1,
            activeUsersToday: d.activeUsersToday || 1,
          };
        }
      }

      const usersQuery = query(collection(db, 'users'), where('isDeleted', '==', false));
      const booksQuery = query(collection(db, 'books'), where('isDeleted', '==', false));
      const sessionsQuery = query(collection(db, 'recitation_sessions'), where('isDeleted', '==', false));
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const activeQuery = query(
        collection(db, 'recitation_sessions'),
        where('isDeleted', '==', false),
        where('createdAt', '>=', Timestamp.fromDate(oneDayAgo))
      );

      const [usersCount, booksCount, sessionsCount, activeCount] = await Promise.all([
        getCountFromServer(usersQuery),
        getCountFromServer(booksQuery),
        getCountFromServer(sessionsQuery),
        getCountFromServer(activeQuery)
      ]);

      const totalUsers = usersCount.data().count;
      const totalBooks = booksCount.data().count;
      const totalSessions = sessionsCount.data().count;
      const activeUsersToday = activeCount.data().count;

      return {
        totalUsers: totalUsers || 1,
        totalBooks: totalBooks || 1,
        totalSessions: totalSessions || 1,
        activeUsersToday: activeUsersToday || 1
      };
    } catch (e) {
      console.error(e);
      return {
        totalUsers: 1,
        totalBooks: 1,
        totalSessions: 1,
        activeUsersToday: 1
      };
    }
  },


  getDailyActive: async (): Promise<{ date: string; activeUsers: number }[]> => {
    try {
      const now = new Date();
      const queries = [];
      const dates: string[] = [];

      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const startOfDay = Timestamp.fromDate(date);
        
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);
        const endOfDay = Timestamp.fromDate(nextDate);

        const q = query(
          collection(db, 'recitation_sessions'),
          where('isDeleted', '==', false),
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<', endOfDay)
        );
        queries.push(getCountFromServer(q));
        dates.push(date.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' }));
      }

      const snapshots = await Promise.all(queries);
      const totalCount = snapshots.reduce((acc, curr) => acc + curr.data().count, 0);

      // If database has no sessions, fall back to mock trend for presentation
      if (totalCount === 0) {
        return dates.map((d) => ({
          date: d,
          activeUsers: 0
        }));
      }

      return snapshots.map((snap, idx) => ({
        date: dates[idx],
        activeUsers: snap.data().count
      }));
    } catch (e) {
      console.error(e);
      // Fallback
      return Array.from({ length: 30 }).map((_, idx) => ({
        date: `${idx + 1}/6`,
        activeUsers: 0
      }));
    }
  },

  getAccuracyDist: async (): Promise<{ name: string; count: number }[]> => {
    try {
      const ranges = [
        { name: '0-20%', min: 0, max: 20 },
        { name: '20-40%', min: 20, max: 40 },
        { name: '40-60%', min: 40, max: 60 },
        { name: '60-80%', min: 60, max: 80 },
        { name: '80-100%', min: 80, max: 101 }
      ];

      const queries = ranges.map(r => {
        const q = query(
          collection(db, 'recitation_sessions'),
          where('isDeleted', '==', false),
          where('score', '>=', r.min),
          where('score', '<', r.max)
        );
        return getCountFromServer(q);
      });

      const snapshots = await Promise.all(queries);
      const totalCount = snapshots.reduce((acc, curr) => acc + curr.data().count, 0);

      if (totalCount === 0) {
        return ranges.map(r => ({ name: r.name, count: 0 }));
      }

      return ranges.map((r, idx) => ({
        name: r.name,
        count: snapshots[idx].data().count
      }));
    } catch (e) {
      console.error(e);
      return [
        { name: '0-20%', count: 0 },
        { name: '20-40%', count: 0 },
        { name: '40-60%', count: 0 },
        { name: '60-80%', count: 0 },
        { name: '80-100%', count: 0 }
      ];
    }
  },

  getMostUsed: async (): Promise<{ name: string; count: number }[]> => {
    try {
      const booksSnap = await getDocs(query(collection(db, 'books'), where('isDeleted', '==', false)));
      if (booksSnap.empty) {
        return [];
      }

      const bookQueries = booksSnap.docs.map(bDoc => {
        const b = bDoc.data();
        const q = query(
          collection(db, 'recitation_sessions'),
          where('bookId', '==', b.id),
          where('isDeleted', '==', false)
        );
        return getCountFromServer(q).then(snap => ({
          name: b.title,
          count: snap.data().count
        }));
      });

      const results = await Promise.all(bookQueries);
      const totalCount = results.reduce((acc, curr) => acc + curr.count, 0);

      if (totalCount === 0) {
        return results.map(r => ({ ...r, count: 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      return results.sort((a, b) => b.count - a.count).slice(0, 10);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getMasteryDist: async (): Promise<{ name: string; value: number }[]> => {
    try {
      const ranges = [
        { name: 'مبتدئ (0-25)', min: 0, max: 25 },
        { name: 'متوسط (25-50)', min: 25, max: 50 },
        { name: 'متقدم (50-75)', min: 50, max: 75 },
        { name: 'متقن (75-100)', min: 75, max: 101 }
      ];

      const queries = ranges.map(r => {
        const q = query(
          collection(db, 'progress'),
          where('isDeleted', '==', false),
          where('mastery', '>=', r.min),
          where('mastery', '<', r.max)
        );
        return getCountFromServer(q);
      });

      const snapshots = await Promise.all(queries);
      const totalCount = snapshots.reduce((acc, curr) => acc + curr.data().count, 0);

      if (totalCount === 0) {
        return ranges.map(r => ({ name: r.name, value: 0 }));
      }

      return ranges.map((r, idx) => ({
        name: r.name,
        value: snapshots[idx].data().count
      }));
    } catch (e) {
      console.error(e);
      return [
        { name: 'مبتدئ (0-25)', value: 0 },
        { name: 'متوسط (25-50)', value: 0 },
        { name: 'متقدم (50-75)', value: 0 },
        { name: 'متقن (75-100)', value: 0 }
      ];
    }
  },

  getNewUsers: async (): Promise<{ name: string; usersCount: number }[]> => {
    try {
      const now = new Date();
      const queries = [];
      const monthNames: string[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = Timestamp.fromDate(d);
        
        const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const endOfMonth = Timestamp.fromDate(nextM);

        const q = query(
          collection(db, 'users'),
          where('isDeleted', '==', false),
          where('createdAt', '>=', startOfMonth),
          where('createdAt', '<', endOfMonth)
        );
        queries.push(getCountFromServer(q));
        
        const mLabel = d.toLocaleDateString('ar-EG', { month: 'short' });
        monthNames.push(mLabel);
      }

      const snapshots = await Promise.all(queries);
      const totalCount = snapshots.reduce((acc, curr) => acc + curr.data().count, 0);

      if (totalCount === 0) {
        return monthNames.map((m) => ({
          name: m,
          usersCount: 0
        }));
      }

      return snapshots.map((snap, idx) => ({
        name: monthNames[idx],
        usersCount: snap.data().count
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
