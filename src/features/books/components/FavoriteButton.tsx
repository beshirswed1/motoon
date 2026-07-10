'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  bookId: string;
}

export function FavoriteButton({ bookId }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const bookIsFav = isFavorite(bookId);

  if (!user) return null; // Only show for logged in users

  return (
    <Button
      variant={bookIsFav ? 'secondary' : 'ghost'}
      size="lg"
      onClick={() => toggleFavorite(bookId)}
      className={`w-full hover:bg-accent rounded-xl h-12 gap-2 mt-2 font-bold transition-all ${
        bookIsFav ? 'text-red-500 bg-red-500/5 hover:bg-red-500/10' : 'text-muted-foreground'
      }`}
    >
      <Heart className={`w-5 h-5 ${bookIsFav ? 'fill-current' : ''}`} />
      <span>{bookIsFav ? 'محفوظ في المفضلة' : 'إضافة للمفضلة'}</span>
    </Button>
  );
}
