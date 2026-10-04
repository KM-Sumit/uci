import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  createAccessToken,
  hashPassword,
  requireAdmin,
  requireAuth,
  verifyPassword,
  type AuthUser,
} from "../lib/auth";

const router: IRouter = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^\+?[0-9]{10,14}$/;

function sendServerError(res: Response, error: unknown) {
  res.status(500).json({ message: "Something went wrong. Please try again." });
}

function cleanUser(row: AuthUser) {
  return { id: row.id, name: row.name, email: row.email, mobile: row.mobile, role: row.role };
}

async function sendSession(res: Response, user: AuthUser, status = 200) {
  const session = await createAccessToken(user);
  res.status(status).json({
    token: session.token,
    expiresIn: session.expiresIn,
    user: cleanUser(user),
  });
}

router.post("/auth/signup", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const mobile = typeof req.body?.mobile === "string" ? req.body.mobile.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name || !emailPattern.test(email) || !mobilePattern.test(mobile) || password.length < 8) {
    res.status(422).json({ message: "Enter a name, valid email, valid mobile number, and password of at least 8 characters." });
    return;
  }
  try {
    const passwordHash = await hashPassword(password);
    const result = await pool.query<AuthUser>(
      `INSERT INTO users (name, email, mobile, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, mobile, role`,
      [name, email, mobile, passwordHash],
    );
    const user = result.rows[0];
    if (!user) throw new Error("Account creation returned no user.");
    await sendSession(res, user, 201);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ message: "An account with that email or mobile number already exists." });
      return;
    }
    sendServerError(res, error);
  }
});

router.post("/auth/login", async (req, res) => {
  const identifier = typeof req.body?.identifier === "string" ? req.body.identifier.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!identifier || !password) {
    res.status(422).json({ message: "Enter your email or mobile number and password." });
    return;
  }
  try {
    const result = await pool.query<AuthUser & { password_hash: string }>(
      `SELECT id, name, email, mobile, role, password_hash
       FROM users WHERE lower(email) = lower($1) OR mobile = $1 LIMIT 1`,
      [identifier],
    );
    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ message: "Email, mobile number, or password is incorrect." });
      return;
    }
    await sendSession(res, user);
  } catch (error) {
    sendServerError(res, error);
  }
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    if (req.authTokenId) {
      await pool.query("DELETE FROM sessions WHERE token_id = $1", [req.authTokenId]);
    }
    res.status(204).end();
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: cleanUser(req.authUser!) });
});

router.get("/student/home", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser!.id;
    const [bannerRows, courseRows, progressRows, testRows, noteRows] = await Promise.all([
      pool.query(
        `SELECT id, title, subtitle, image_url AS "imageUrl", cta_label AS "ctaLabel", href
         FROM banners WHERE enabled = true ORDER BY sort_order, id`,
      ),
      pool.query(
        `SELECT c.id, c.title, c.description, c.instructor, c.category, c.exam,
                c.lesson_count AS "lessonCount", c.duration_minutes AS "durationMinutes",
                c.price_cents AS "priceCents", c.thumbnail_url AS "thumbnailUrl"
         FROM courses c WHERE c.published = true ORDER BY c.created_at DESC LIMIT 4`,
      ),
      pool.query(
        `SELECT c.id AS "courseId", c.title AS "courseTitle", p.completed_lessons AS "completedLessons",
                c.lesson_count AS "lessonCount", l.title AS "lastLesson"
         FROM course_progress p JOIN courses c ON c.id = p.course_id
         LEFT JOIN lessons l ON l.id = p.last_lesson_id
         WHERE p.user_id = $1 AND c.published = true ORDER BY p.updated_at DESC LIMIT 1`,
        [userId],
      ),
      pool.query(
        `SELECT id, title, subject, topic, question_count AS "questionCount",
                duration_minutes AS "durationMinutes", difficulty
         FROM tests WHERE published = true ORDER BY created_at DESC LIMIT 3`,
      ),
      pool.query(
        `SELECT id, title, description, subject, exam, created_at AS "createdAt"
         FROM notes WHERE published = true ORDER BY created_at DESC LIMIT 3`,
      ),
    ]);
    const progress = progressRows.rows[0];
    const continueLearning = progress
      ? {
          ...progress,
          progress: progress.lessonCount
            ? Math.round((progress.completedLessons / progress.lessonCount) * 100)
            : 0,
        }
      : null;
    res.json({
      student: cleanUser(req.authUser!),
      banners: bannerRows.rows,
      continueLearning,
      popularCourses: courseRows.rows,
      upcomingTests: testRows.rows,
      latestNotes: noteRows.rows,
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/courses", requireAuth, async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? `%${req.query.search.trim()}%` : null;
    const exam = typeof req.query.exam === "string" ? req.query.exam.trim() : null;
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.instructor, c.category, c.exam,
              c.lesson_count AS "lessonCount", c.duration_minutes AS "durationMinutes",
              c.price_cents AS "priceCents", c.thumbnail_url AS "thumbnailUrl",
              COALESCE(p.completed_lessons, 0) AS "completedLessons"
       FROM courses c LEFT JOIN course_progress p ON p.course_id = c.id AND p.user_id = $1
       WHERE c.published = true
         AND ($2::text IS NULL OR c.title ILIKE $2 OR c.exam ILIKE $2 OR c.category ILIKE $2)
         AND ($3::text IS NULL OR c.exam = $3)
       ORDER BY c.created_at DESC`,
      [req.authUser!.id, search, exam],
    );
    res.json({ courses: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/courses/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: "Invalid course." });
    return;
  }
  try {
    const courseResult = await pool.query(
      `SELECT id, title, description, instructor, category, exam, lesson_count AS "lessonCount",
              duration_minutes AS "durationMinutes", price_cents AS "priceCents",
              thumbnail_url AS "thumbnailUrl"
       FROM courses WHERE id = $1 AND published = true`,
      [id],
    );
    const course = courseResult.rows[0];
    if (!course) {
      res.status(404).json({ message: "Course not found." });
      return;
    }
    const lessonResult = await pool.query(
      `SELECT ch.id AS "chapterId", ch.title AS "chapterTitle",
              l.id, l.title, l.kind, l.duration_minutes AS "durationMinutes",
              l.resource_url AS "resourceUrl", l.body, l.sort_order AS "sortOrder",
              (lp.lesson_id IS NOT NULL) AS completed
       FROM course_chapters ch
       LEFT JOIN lessons l ON l.chapter_id = ch.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
       WHERE ch.course_id = $1 ORDER BY ch.sort_order, l.sort_order`,
      [id, req.authUser!.id],
    );
    res.json({ course, lessons: lessonResult.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.post("/lessons/:id/complete", requireAuth, async (req, res) => {
  const lessonId = Number(req.params.id);
  if (!Number.isInteger(lessonId) || lessonId < 1) {
    res.status(400).json({ message: "Invalid lesson." });
    return;
  }
  try {
    const lesson = await pool.query<{ course_id: number }>(
      `SELECT ch.course_id FROM lessons l
       JOIN course_chapters ch ON ch.id = l.chapter_id WHERE l.id = $1`,
      [lessonId],
    );
    const courseId = lesson.rows[0]?.course_id;
    if (!courseId) {
      res.status(404).json({ message: "Lesson not found." });
      return;
    }
    await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
       ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [req.authUser!.id, lessonId],
    );
    await pool.query(
      `INSERT INTO course_progress (user_id, course_id, completed_lessons, last_lesson_id)
       SELECT $1, $2, COUNT(lp.lesson_id)::int, $3
       FROM lesson_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       JOIN course_chapters ch ON ch.id = l.chapter_id
       WHERE lp.user_id = $1 AND ch.course_id = $2
       ON CONFLICT (user_id, course_id) DO UPDATE SET
         completed_lessons = EXCLUDED.completed_lessons,
         last_lesson_id = EXCLUDED.last_lesson_id,
         updated_at = NOW()`,
      [req.authUser!.id, courseId, lessonId],
    );
    res.json({ completed: true });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/notes", requireAuth, async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? `%${req.query.search.trim()}%` : null;
    const subject = typeof req.query.subject === "string" ? req.query.subject.trim() : null;
    const result = await pool.query(
      `SELECT id, title, description, subject, exam, pdf_url AS "pdfUrl", created_at AS "createdAt"
       FROM notes WHERE published = true
         AND ($1::text IS NULL OR title ILIKE $1 OR subject ILIKE $1 OR exam ILIKE $1)
         AND ($2::text IS NULL OR subject = $2)
       ORDER BY created_at DESC`,
      [search, subject],
    );
    res.json({ notes: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/notes/:id", requireAuth, async (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId) || noteId < 1) {
    res.status(400).json({ message: "Invalid note." });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT id, title, description, body, subject, exam,
              pdf_url AS "pdfUrl", created_at AS "createdAt"
       FROM notes WHERE id = $1 AND published = true`,
      [noteId],
    );
    const note = result.rows[0];
    if (!note) {
      res.status(404).json({ message: "Note not found." });
      return;
    }
    res.json({ note });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/tests", requireAuth, async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? `%${req.query.search.trim()}%` : null;
    const result = await pool.query(
      `SELECT t.id, t.title, t.subject, t.topic, t.question_count AS "questionCount",
              t.duration_minutes AS "durationMinutes", t.difficulty,
              EXISTS (SELECT 1 FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = $1
                AND a.submitted_at IS NOT NULL) AS attempted
       FROM tests t WHERE t.published = true
         AND ($2::text IS NULL OR t.title ILIKE $2 OR t.topic ILIKE $2 OR t.subject ILIKE $2)
       ORDER BY t.created_at DESC`,
      [req.authUser!.id, search],
    );
    res.json({ tests: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/tests/:id", requireAuth, async (req, res) => {
  const testId = Number(req.params.id);
  if (!Number.isInteger(testId) || testId < 1) {
    res.status(400).json({ message: "Invalid test." });
    return;
  }
  try {
    const testResult = await pool.query(
      `SELECT id, title, subject, topic, question_count AS "questionCount",
              duration_minutes AS "durationMinutes", difficulty
       FROM tests WHERE id = $1 AND published = true`,
      [testId],
    );
    const test = testResult.rows[0];
    if (!test) {
      res.status(404).json({ message: "Test not found." });
      return;
    }
    const questionResult = await pool.query(
      `SELECT id, prompt, options, topic, difficulty
       FROM test_questions WHERE test_id = $1 ORDER BY sort_order, id`,
      [testId],
    );
    res.json({ test, questions: questionResult.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.post("/tests/:id/start", requireAuth, async (req, res) => {
  const testId = Number(req.params.id);
  if (!Number.isInteger(testId) || testId < 1) {
    res.status(400).json({ message: "Invalid test." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const testResult = await client.query(
      `SELECT id, title, subject, topic, duration_minutes AS "durationMinutes"
       FROM tests WHERE id = $1 AND published = true FOR SHARE`,
      [testId],
    );
    const test = testResult.rows[0];
    if (!test) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Test not found." });
      return;
    }
    const existing = await client.query(
      `SELECT id, started_at AS "startedAt" FROM test_attempts
       WHERE user_id = $1 AND test_id = $2 AND submitted_at IS NULL
       ORDER BY started_at DESC LIMIT 1 FOR UPDATE`,
      [req.authUser!.id, testId],
    );
    let attempt = existing.rows[0];
    if (attempt) {
      const deadline = new Date(attempt.startedAt).getTime() + Number(test.durationMinutes) * 60_000;
      if (deadline <= Date.now()) {
        await client.query(
          "UPDATE test_attempts SET submitted_at = NOW() WHERE id = $1",
          [attempt.id],
        );
        attempt = undefined;
      }
    }
    if (!attempt) {
      const created = await client.query(
        `INSERT INTO test_attempts (user_id, test_id, total_questions)
         SELECT $1, $2, COUNT(*)::int FROM test_questions WHERE test_id = $2
         RETURNING id, started_at AS "startedAt"`,
        [req.authUser!.id, testId],
      );
      attempt = created.rows[0];
    }
    const questionResult = await client.query(
      `SELECT id, prompt, options FROM test_questions WHERE test_id = $1 ORDER BY sort_order, id`,
      [testId],
    );
    await client.query("COMMIT");
    res.status(201).json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      deadline: new Date(new Date(attempt.startedAt).getTime() + Number(test.durationMinutes) * 60_000),
      test,
      questions: questionResult.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    sendServerError(res, error);
  } finally {
    client.release();
  }
});

router.post("/test-attempts/:id/submit", requireAuth, async (req, res) => {
  const attemptId = Number(req.params.id);
  const rawAnswers = req.body?.answers;
  if (!Number.isInteger(attemptId) || attemptId < 1 || !rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    res.status(422).json({ message: "Test answers could not be submitted." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const attemptResult = await client.query(
      `SELECT a.id, a.test_id AS "testId", a.started_at AS "startedAt",
              a.submitted_at AS "submittedAt", t.duration_minutes AS "durationMinutes"
       FROM test_attempts a JOIN tests t ON t.id = a.test_id
       WHERE a.id = $1 AND a.user_id = $2 FOR UPDATE`,
      [attemptId, req.authUser!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Test attempt not found." });
      return;
    }
    if (attempt.submittedAt) {
      await client.query("ROLLBACK");
      res.status(409).json({ message: "This test has already been submitted." });
      return;
    }
    const questionResult = await client.query(
      `SELECT id, correct_index AS "correctIndex" FROM test_questions
       WHERE test_id = $1 ORDER BY sort_order, id`,
      [attempt.testId],
    );
    const deadline = new Date(attempt.startedAt).getTime() + Number(attempt.durationMinutes) * 60_000;
    const isLateSubmission = Date.now() > deadline + 2_000;
    let correct = 0;
    let wrong = 0;
    let attempted = 0;
    for (const question of questionResult.rows as Array<{ id: number; correctIndex: number }>) {
      const value = isLateSubmission ? undefined : rawAnswers[String(question.id)];
      const selected = Number.isInteger(value) && value >= 0 && value <= 3 ? value : null;
      const isCorrect = selected === question.correctIndex;
      if (selected !== null) {
        attempted += 1;
        if (isCorrect) correct += 1;
        else wrong += 1;
      }
      await client.query(
        `INSERT INTO test_answers (attempt_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attemptId, question.id, selected, isCorrect],
      );
    }
    const total = questionResult.rowCount ?? 0;
    const unattempted = total - attempted;
    const now = new Date();
    const started = new Date(attempt.startedAt);
    const timeTaken = Math.max(0, Math.min(
      Math.floor((now.getTime() - started.getTime()) / 1000),
      Number(attempt.durationMinutes) * 60,
    ));
    const score = correct;
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    await client.query(
      `UPDATE test_attempts SET submitted_at = NOW(), score = $1, correct_answers = $2,
       wrong_answers = $3, unattempted = $4, percentage = $5, accuracy = $6,
       time_taken_seconds = $7 WHERE id = $8`,
      [score, correct, wrong, unattempted, percentage, accuracy, timeTaken, attemptId],
    );
    await client.query("COMMIT");
    res.json({ attemptId, score, totalQuestions: total, correct, wrong, unattempted, percentage, accuracy, timeTakenSeconds: timeTaken });
  } catch (error) {
    await client.query("ROLLBACK");
    sendServerError(res, error);
  } finally {
    client.release();
  }
});

router.get("/test-attempts", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.test_id AS "testId", t.title AS "testTitle",
              a.started_at AS "startedAt", a.submitted_at AS "submittedAt",
              a.score, a.total_questions AS "totalQuestions", a.correct_answers AS correct,
              a.wrong_answers AS wrong, a.unattempted, a.percentage, a.accuracy,
              a.time_taken_seconds AS "timeTakenSeconds"
       FROM test_attempts a JOIN tests t ON t.id = a.test_id
       WHERE a.user_id = $1 AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC`,
      [req.authUser!.id],
    );
    res.json({ attempts: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.get("/test-attempts/:id", requireAuth, async (req, res) => {
  const attemptId = Number(req.params.id);
  if (!Number.isInteger(attemptId) || attemptId < 1) {
    res.status(400).json({ message: "Invalid test result." });
    return;
  }
  try {
    const result = await pool.query(
      `SELECT a.id, a.test_id AS "testId", t.title AS "testTitle",
              a.started_at AS "startedAt", a.submitted_at AS "submittedAt",
              a.score, a.total_questions AS "totalQuestions", a.correct_answers AS correct,
              a.wrong_answers AS wrong, a.unattempted, a.percentage, a.accuracy,
              a.time_taken_seconds AS "timeTakenSeconds"
       FROM test_attempts a JOIN tests t ON t.id = a.test_id
       WHERE a.id = $1 AND a.user_id = $2 AND a.submitted_at IS NOT NULL`,
      [attemptId, req.authUser!.id],
    );
    const attempt = result.rows[0];
    if (!attempt) {
      res.status(404).json({ message: "Test result not found." });
      return;
    }
    const review = await pool.query(
      `SELECT q.id, q.prompt, q.options, q.correct_index AS "correctIndex",
              q.explanation, a.selected_option AS "selectedOption", a.is_correct AS "isCorrect"
       FROM test_answers a JOIN test_questions q ON q.id = a.question_id
       WHERE a.attempt_id = $1 ORDER BY q.sort_order, q.id`,
      [attemptId],
    );
    res.json({ attempt, review: review.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/dashboard", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS students,
        (SELECT COUNT(*)::int FROM courses) AS courses,
        (SELECT COUNT(*)::int FROM notes) AS notes,
        (SELECT COUNT(*)::int FROM tests) AS tests,
        (SELECT COUNT(*)::int FROM test_attempts WHERE submitted_at IS NOT NULL) AS attempts`,
    );
    res.json(result.rows[0]);
  } catch (error) {
    sendServerError(res, error);
  }
});

adminRouter.get("/results", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.name AS "studentName", u.email, t.title AS "testTitle",
              a.score, a.total_questions AS "totalQuestions", a.percentage, a.accuracy,
              a.time_taken_seconds AS "timeTakenSeconds", a.submitted_at AS "submittedAt"
       FROM test_attempts a JOIN users u ON u.id = a.user_id JOIN tests t ON t.id = a.test_id
       WHERE a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC`,
    );
    res.json({ results: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

// Admin Scoreboard: all test results grouped by test
adminRouter.get("/scoreboard", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id AS "testId", t.title AS "testTitle", t.subject, t.topic, t.difficulty,
              u.name AS "studentName", u.email,
              a.id AS "attemptId",
              a.score, a.total_questions AS "totalQuestions",
              a.correct_answers AS "correct", a.wrong_answers AS "wrong",
              a.unattempted, a.percentage, a.accuracy,
              a.time_taken_seconds AS "timeTakenSeconds",
              a.submitted_at AS "submittedAt"
       FROM test_attempts a
       JOIN users u ON u.id = a.user_id
       JOIN tests t ON t.id = a.test_id
       WHERE a.submitted_at IS NOT NULL
       ORDER BY t.id, a.percentage DESC, a.submitted_at DESC`,
    );
    res.json({ scoreboard: result.rows });
  } catch (error) {
    sendServerError(res, error);
  }
});

// Admin: Generate Test via OpenAI GPT
adminRouter.post("/generate-test", async (req, res) => {
  const topic = typeof req.body?.topic === "string" ? req.body.topic.trim() : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "General Knowledge";
  const difficulty = typeof req.body?.difficulty === "string" ? req.body.difficulty.trim() : "Medium";
  const questionCount = Number.isInteger(req.body?.questionCount) ? Math.min(20, Math.max(3, req.body.questionCount)) : 10;
  const durationMinutes = Number.isInteger(req.body?.durationMinutes) ? Math.min(60, Math.max(5, req.body.durationMinutes)) : 15;

  if (!topic) {
    res.status(422).json({ message: "Topic is required to generate a test." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ message: "Gemini API key is not configured on the server. Set GEMINI_API_KEY environment variable." });
    return;
  }

  try {
    const prompt = `Generate a multiple choice quiz with exactly ${questionCount} questions on the topic: "${topic}" for subject "${subject}".
Difficulty level: ${difficulty}.
IMPORTANT: Respond with ONLY valid JSON. No markdown, no backticks, no explanation.
Format exactly like this:
{
  "title": "short quiz title here",
  "questions": [
    {
      "prompt": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation why Option A is correct."
    }
  ]
}
Rules:
- Exactly ${questionCount} questions
- Each question has exactly 4 options
- correctIndex is 0-3 (0=first option)
- All questions must be about: ${topic}
- Difficulty: ${difficulty}`;

    const gptResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: "You are an expert exam question creator. Always respond with valid JSON only." }] },
        contents: [
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!gptResponse.ok) {
      const errText = await gptResponse.text();
      res.status(502).json({ message: `Gemini API error: ${gptResponse.status}. ${errText.slice(0, 200)}` });
      return;
    }

    const gptData = await gptResponse.json() as any;
    const rawContent = gptData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: { title: string; questions: Array<{ prompt: string; options: string[]; correctIndex: number; explanation: string }> };
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      res.status(502).json({ message: "GPT returned invalid JSON. Please try again." });
      return;
    }

    if (!parsed.title || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      res.status(502).json({ message: "GPT response missing required fields. Please try again." });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const testInsert = await client.query<{ id: number }>(
        `INSERT INTO tests (title, subject, topic, question_count, duration_minutes, difficulty, published)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [parsed.title, subject, topic, parsed.questions.length, durationMinutes, difficulty],
      );
      const testId = testInsert.rows[0]!.id;

      for (let i = 0; i < parsed.questions.length; i++) {
        const q = parsed.questions[i]!;
        await client.query(
          `INSERT INTO test_questions (test_id, prompt, options, correct_index, explanation, topic, difficulty, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [testId, q.prompt, JSON.stringify(q.options), q.correctIndex, q.explanation ?? "", topic, difficulty, i],
        );
      }
      await client.query("COMMIT");
      res.status(201).json({ testId, title: parsed.title, questionCount: parsed.questions.length, topic, subject, difficulty, durationMinutes });
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    sendServerError(res, error);
  }
});

// Admin: Create Course
adminRouter.post("/courses", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const instructor = typeof req.body?.instructor === "string" ? req.body.instructor.trim() : "UCI Faculty";
  const exam = typeof req.body?.exam === "string" ? req.body.exam.trim() : "SSC";
  const category = typeof req.body?.category === "string" ? req.body.category.trim() : "SSC";
  const thumbnailUrl = typeof req.body?.thumbnailUrl === "string" ? req.body.thumbnailUrl.trim() : "";

  if (!title) {
    res.status(422).json({ message: "Course title is required." });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO courses (title, description, instructor, exam, category, thumbnail_url, published)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [title, description, instructor, exam, category, thumbnailUrl],
    );
    res.status(201).json({ courseId: result.rows[0]!.id, title });
  } catch (error) {
    sendServerError(res, error);
  }
});

// Admin: Create Note
adminRouter.post("/notes", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
  const exam = typeof req.body?.exam === "string" ? req.body.exam.trim() : "";
  const pdfUrl = typeof req.body?.pdfUrl === "string" ? req.body.pdfUrl.trim() : "";

  if (!title || !subject || !exam) {
    res.status(422).json({ message: "Title, subject and exam are required." });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO notes (title, description, body, subject, exam, pdf_url, published)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [title, description, body, subject, exam, pdfUrl],
    );
    res.status(201).json({ noteId: result.rows[0]!.id, title });
  } catch (error) {
    sendServerError(res, error);
  }
});

router.use("/admin", adminRouter);

export default router;