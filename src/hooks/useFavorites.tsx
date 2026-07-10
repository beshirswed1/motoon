'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/firebase/favorites.service';
import toast from 'react-hot-toast';

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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch favorites when user changes
  useEffect(() => {
    if (!user?.id) {
      setFavoriteIds(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);
    favoritesService.getAll(user.id).then(ids => {
      if (!cancelled) {
        setFavoriteIds(new Set(ids));
      }
    }).catch(console.error).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user?.id]);

  const isFavorite = useCallback((bookId: string) => {
    return favoriteIds.has(bookId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (bookId: string) => {
    if (!user?.id) {
      toast.error('يجب تسجيل الدخول لاستخدام المفضلة');
      return;
    }

    const isCurrentlyFav = favoriteIds.has(bookId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFav) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });

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
