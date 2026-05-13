export interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
}

export interface VoteInfo {
  id: string;
  userId: string;
  commentId: string;
  value: number;
}

export interface CommentData {
  id: string;
  content: string;
  raw?: string;
  pageKey: string;
  siteName?: string;
  userId: string;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  isPinned: boolean;
  isPending: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  ipRegion?: string | null;
  createdAt: string;
  updatedAt?: string;
  user: CommentUser;
  replies?: CommentData[];
  _count?: { votes: number };
  votes?: VoteInfo[];
}
