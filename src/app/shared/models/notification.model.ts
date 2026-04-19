export interface Notification {
  _id: string;
  recipientId: string;
  senderId: { _id: string; username: string; avatar: string | null };
  type: 'comment' | 'follow' | 'rating';
  postId?: string;
  read: boolean;
  message: string;
  createdAt: string;
}
