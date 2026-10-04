export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: "student" | "admin";
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  ctaLabel: string;
  href?: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  exam: string;
  lessonCount: number;
  durationMinutes: number;
  priceCents: number;
  thumbnailUrl?: string;
  completedLessons?: number;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  body: string;
  subject: string;
  exam: string;
  pdfUrl?: string;
  createdAt?: string;
}

export interface TestSummary {
  id: number;
  title: string;
  subject: string;
  topic: string;
  questionCount: number;
  durationMinutes: number;
  difficulty: string;
  attempted?: boolean;
}

export interface HomeData {
  student: User;
  banners: Banner[];
  continueLearning: null | {
    courseId: number;
    courseTitle: string;
    completedLessons: number;
    lessonCount: number;
    lastLesson?: string | null;
    progress: number;
  };
  popularCourses: Course[];
  upcomingTests: TestSummary[];
  latestNotes: Note[];
}

export interface Lesson {
  id: number | null;
  chapterId: number;
  chapterTitle: string;
  title: string | null;
  kind: string | null;
  durationMinutes: number | null;
  resourceUrl: string | null;
  body: string | null;
  sortOrder: number | null;
  completed: boolean;
}

export interface TestQuestion {
  id: number;
  prompt: string;
  options: string[];
}

export interface TestAttemptSession {
  attemptId: number;
  startedAt: string;
  deadline: string;
  test: TestSummary;
  questions: TestQuestion[];
}

export interface AttemptResult {
  id: number;
  testId: number;
  testTitle: string;
  startedAt: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
}

export interface AdminStats {
  students: number;
  courses: number;
  notes: number;
  tests: number;
  attempts: number;
}

export interface AdminResult {
  studentName: string;
  email: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  submittedAt: string;
}