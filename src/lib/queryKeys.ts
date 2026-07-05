export const queryKeys = {
  books: {
    all: ['books'] as const,
    list: (filters?: Record<string, any>) => ['books', 'list', filters] as const,
    detail: (slug: string) => ['books', 'detail', slug] as const,
  },
  verses: {
    all: ['verses'] as const,
    list: (bookId: string) => ['verses', 'list', bookId] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
  },
  progress: {
    all: ['progress'] as const,
    user: (userId: string) => ['progress', 'user', userId] as const,
    due: (userId: string) => ['progress', 'due', userId] as const,
  },
  recitation: {
    all: ['recitation'] as const,
    user: (userId: string) => ['recitation', 'user', userId] as const,
  },
  admin: {
    stats: ['admin', 'stats'] as const,
  }
};
