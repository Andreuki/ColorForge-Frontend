export interface Rating {
  userId: string | number;
  _id?: string;
  value: number;
}

export interface Comment {
  id?: number | string;
  _id: string;
  userId: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  postId?: string | number;
  text: string;
  imageUrl: string | null;
  link: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: { id?: string | number; _id?: string; name?: string; username?: string; avatar?: string };
}

export interface Post {
  id?: number | string;
  _id: string;
  userId: string | number | { id?: string | number; _id?: string; name?: string; username?: string; avatar?: string };
  analysisId?: string | { _id?: string; id?: string | number; imageUrl?: string };
  imageUrls: string[];
  imageUrl?: string;
  title: string;
  description: string;
  techniques: string[];
  colors: string[];
  privacy: 'public' | 'followers' | 'private';
  faction: string;
  savedBy: string[];
  ratings: Rating[];
  comments: Comment[];
  createdAt: string;
  averageRating?: number;
  totalRatings?: number;
}

export type GalleryPost = Post;
