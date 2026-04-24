export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  comparePrice?: number | string | null;
  sortOrder: number;
  isActive: boolean;
  courseCount?: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  thumbnailUrl: string | null;
  price: number | null;
  comparePrice?: number | string | null;
  durationMins: number;
  lessonCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  isVisibleToStudents?: boolean;
  categoryId: string;
  category?: Category;
  modules?: Module[];
  tags?: Tag[];
  isFavorited?: boolean;
  progressPercent?: number;
}

export interface Module {
  id: string;
  title: string;
  sortOrder: number;
  courseId: string;
  lessons: Lesson[];
  resources?: Resource[];
}

export type ResourceType = 'PDF' | 'DOC' | 'SHEET' | 'PPT' | 'IMAGE' | 'AUDIO' | 'ARCHIVE' | 'OTHER';

export interface Resource {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  type: ResourceType;
  sizeBytes: string;
  sortOrder?: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number;
  sortOrder: number;
  isFreePreview: boolean;
  moduleId: string;
  isCompleted?: boolean;
  watchedSeconds?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt: string | null;
  lastWatchedAt: string;
}
