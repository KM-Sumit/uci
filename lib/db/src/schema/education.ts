import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    mobile: text("mobile").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("student"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_mobile_unique").on(table.mobile),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenId: text("token_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const banners = pgTable(
  "banners",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    ctaLabel: text("cta_label").notNull().default("Explore"),
    href: text("href"),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("banners_enabled_order_idx").on(table.enabled, table.sortOrder)],
);

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    instructor: text("instructor").notNull().default("UCI Faculty"),
    category: text("category").notNull().default("SSC"),
    exam: text("exam").notNull().default("SSC"),
    lessonCount: integer("lesson_count").notNull().default(0),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("courses_published_idx").on(table.published),
    index("courses_exam_idx").on(table.exam),
  ],
);

export const courseChapters = pgTable(
  "course_chapters",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("course_chapters_course_order_idx").on(table.courseId, table.sortOrder)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => courseChapters.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("text"),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    resourceUrl: text("resource_url").notNull().default(""),
    body: text("body").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("lessons_chapter_order_idx").on(table.chapterId, table.sortOrder)],
);

export const courseProgress = pgTable(
  "course_progress",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completedLessons: integer("completed_lessons").notNull().default(0),
    lastLessonId: integer("last_lesson_id").references(() => lessons.id, {
      onDelete: "set null",
    }),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.courseId] }),
    index("course_progress_user_idx").on(table.userId),
  ],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index("lesson_progress_user_idx").on(table.userId),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    body: text("body").notNull().default(""),
    subject: text("subject").notNull(),
    exam: text("exam").notNull(),
    pdfUrl: text("pdf_url").notNull().default(""),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("notes_published_idx").on(table.published),
    index("notes_subject_idx").on(table.subject),
  ],
);

export const tests = pgTable(
  "tests",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    topic: text("topic").notNull(),
    questionCount: integer("question_count").notNull().default(0),
    durationMinutes: integer("duration_minutes").notNull().default(20),
    difficulty: text("difficulty").notNull().default("Medium"),
    published: boolean("published").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("tests_published_idx").on(table.published)],
);

export const testQuestions = pgTable(
  "test_questions",
  {
    id: serial("id").primaryKey(),
    testId: integer("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation").notNull().default(""),
    topic: text("topic").notNull().default(""),
    difficulty: text("difficulty").notNull().default("Medium"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [index("test_questions_test_order_idx").on(table.testId, table.sortOrder)],
);

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    testId: integer("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    score: integer("score"),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers"),
    wrongAnswers: integer("wrong_answers"),
    unattempted: integer("unattempted"),
    percentage: integer("percentage"),
    accuracy: integer("accuracy"),
    timeTakenSeconds: integer("time_taken_seconds"),
  },
  (table) => [
    index("test_attempts_user_idx").on(table.userId, table.startedAt),
    index("test_attempts_test_idx").on(table.testId),
  ],
);

export const testAnswers = pgTable(
  "test_answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .notNull()
      .references(() => testAttempts.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => testQuestions.id, { onDelete: "cascade" }),
    selectedOption: integer("selected_option"),
    isCorrect: boolean("is_correct").notNull().default(false),
  },
  (table) => [
    uniqueIndex("test_answers_attempt_question_unique").on(
      table.attemptId,
      table.questionId,
    ),
  ],
);