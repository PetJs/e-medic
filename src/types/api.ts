export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "admin";
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  cover_image: string;
  is_published: boolean;
  created_at: string;
}

export interface CourseDetail extends Course {
  modules: Module[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  is_premium: boolean;
  cover_image_url?: string;
  cover_image_status?: "pending" | "ready" | "failed";
  lesson_count?: number;
  total_duration?: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  created_at: string;
}

export interface Content {
  id: string;
  lesson_id: string;
  type: "video" | "pdf" | "image";
  title: string;
  mime_type: string;
  size: number;
  duration: number;
  order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "pending" | "active" | "canceled" | "expired";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  provider: string;
  provider_payment_id: string;
  created_at: string;
}

export interface Progress {
  id: string;
  lesson_id: string;
  module_id?: string;
  is_completed: boolean;
  progress_pct: number;
  last_position: number;
  completed_at?: string;
}

export interface ListUsersResponse {
  users: User[];
  total_count: number;
  page: number;
  limit: number;
}

export interface DiscussionPost {
  id: string;
  module_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  comment_count: number;
  author: User;
  created_at: string;
}

export interface DiscussionComment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  body: string;
  author: User;
  created_at: string;
}

export interface ListPostsResponse {
  posts: DiscussionPost[];
  total_count: number;
  page: number;
  limit: number;
}

export interface ListCommentsResponse {
  comments: DiscussionComment[];
}
