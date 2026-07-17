'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/firebase/favorites.service';
import toast from 'react-hot-toast';

const LOCAL_STORAGE_KEY = 'motoon-favorites';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isFavorite: (bookId: string) => boolean;
  toggleFavorite: (bookId: string) => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  isFavorite: () => false,
  toggleFavorite: () => {},
  loading: false,
});

/** Read favorites from localStorage */
function getLocalFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

/** Save favorites to localStorage */
function saveLocalFavorites(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => getLocalFavorites());
  const [loading, setLoading] = useState(false);

  // Fetch favorites when user changes — merge with local
  useEffect(() => {
    if (!user?.id) {
      // Not logged in: use localStorage only
      setFavoriteIds(getLocalFavorites());
      return;
    }

    let cancelled = false;
    setLoading(true);
    
    favoritesService.getAll(user.id).then(ids => {
      if (!cancelled) {
        const localIds = getLocalFavorites();
        const merged = new Set([...ids, ...localIds]);
        setFavoriteIds(merged);
        saveLocalFavorites(merged);

        // Sync any local-only favorites to Firebase
        const localOnly = [...localIds].filter(id => !ids.includes(id));
        for (const id of localOnly) {
          favoritesService.add(user.id, id).catch(console.error);
        }
      }
    }).catch((err) => {
      console.error('Failed to fetch favorites from Firebase:', err);
      if (!cancelled) {
        // Fallback to localStorage
        setFavoriteIds(getLocalFavorites());
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id]);

  const isFavorite = useCallback((bookId: string) => {
    return favoriteIds.has(bookId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (bookId: string) => {
    const isCurrentlyFav = favoriteIds.has(bookId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFav) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      saveLocalFavorites(next);
      return next;
    });

    // If not logged in, just save locally
    if (!user?.id) {
      toast.success(isCurrentlyFav ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
      return;
    }

    try {
      if (isCurrentlyFav) {
        await favoritesService.remove(user.id, bookId);
        toast.success('تمت الإزالة من المفضلة');
      } else {
        await favoritesService.add(user.id, bookId);
        toast.success('تمت الإضافة إلى المفضلة');
      }
    } catch (err) {
      // Revert on error
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFav) {
          next.add(bookId);
        } else {
          next.delete(bookId);
        }
        saveLocalFavorites(next);
        return next;
      });
      toast.error('حدث خطأ. يرجى المحاولة مجدداً');
      console.error(err);
    }
  }, [user?.id, favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
