import { pool } from "@workspace/db";

async function seed() {
  await pool.query(
    `INSERT INTO banners (title, subtitle, cta_label, href, enabled, sort_order)
     SELECT 'Prepare with a clear plan', 'Build your SSC CGL preparation one lesson at a time.', 'Explore courses', '/courses', true, 0
     WHERE NOT EXISTS (SELECT 1 FROM banners WHERE title = 'Prepare with a clear plan')`,
  );

  const courseResult = await pool.query<{ id: number }>(
    `INSERT INTO courses
      (title, description, instructor, category, exam, lesson_count, duration_minutes, price_cents, published)
     SELECT 'SSC CGL Quantitative Aptitude', 'A focused foundation in arithmetic, taught through short lessons and practice.', 'UCI Faculty', 'SSC', 'SSC CGL', 3, 95, 0, true
     WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'SSC CGL Quantitative Aptitude')
     RETURNING id`,
  );
  let courseId = courseResult.rows[0]?.id;
  if (!courseId) {
    const existing = await pool.query<{ id: number }>(
      "SELECT id FROM courses WHERE title = $1 LIMIT 1",
      ["SSC CGL Quantitative Aptitude"],
    );
    courseId = existing.rows[0]?.id;
  }

  if (courseId) {
    let chapterId: number | undefined;
    const existingChapter = await pool.query<{ id: number }>(
      "SELECT id FROM course_chapters WHERE course_id = $1 AND title = $2 LIMIT 1",
      [courseId, "Arithmetic foundations"],
    );
    chapterId = existingChapter.rows[0]?.id;
    if (!chapterId) {
      const inserted = await pool.query<{ id: number }>(
        `INSERT INTO course_chapters (course_id, title, sort_order)
         VALUES ($1, $2, 0) RETURNING id`,
        [courseId, "Arithmetic foundations"],
      );
      chapterId = inserted.rows[0]?.id;
    }
    if (chapterId) {
      const lessons = [
        {
          title: "Percentages and conversions",
          minutes: 28,
          body: "A percentage is a ratio expressed out of 100. To convert a percent to a fraction, divide by 100 and simplify. To find p% of a number n, calculate (p × n) ÷ 100. For example, 18% of 250 is 18 × 250 ÷ 100 = 45. When comparing values, convert both percentages to the same base before subtracting.",
        },
        {
          title: "Profit, loss and discount",
          minutes: 34,
          body: "Profit = selling price − cost price. Loss = cost price − selling price. Profit or loss percentage is calculated on cost price. A discount is calculated on marked price. For successive discounts a% and b%, the net discount is a + b − ab/100 percent. Keep the base value explicit in each step.",
        },
        {
          title: "Ratio and proportion",
          minutes: 33,
          body: "A ratio a:b compares quantities in the same units. If a:b = m:n, write a = km and b = kn for a common multiplier k. In a proportion a:b = c:d, the cross products satisfy ad = bc. Reduce ratios by dividing each term by their greatest common factor before applying them.",
        },
      ];
      for (const [index, lesson] of lessons.entries()) {
        await pool.query(
          `INSERT INTO lessons (chapter_id, title, kind, duration_minutes, body, sort_order)
           SELECT $1, $2, 'text', $3, $4, $5
           WHERE NOT EXISTS (SELECT 1 FROM lessons WHERE chapter_id = $1 AND title = $2)`,
          [chapterId, lesson.title, lesson.minutes, lesson.body, index],
        );
      }
    }
  }

  const noteEntries = [
    ["Percentage quick sheet", "Core percentage formulas with worked examples.", "Mathematics", "SSC CGL", "Convert the rate to a fraction over 100. For successive changes, multiply the factors: an increase of a% followed by a decrease of b% gives (1 + a/100)(1 − b/100). For a fixed number, the percentage change is (change ÷ original) × 100. Always use the original value as the base unless the question states otherwise."],
    ["Reasoning: number series", "A repeatable method for checking common number-series patterns.", "Reasoning", "SSC CGL", "Check adjacent differences first, then differences of differences. If those are inconsistent, test ratios, alternating subsequences, squares or cubes, and combinations such as ×2 + 1. Write each step above the sequence rather than guessing the next term."],
    ["English: subject–verb agreement", "A compact guide to matching subjects and verbs.", "English", "SSC CGL", "A singular subject takes a singular verb and a plural subject takes a plural verb. Ignore phrases between the subject and verb when finding agreement. With either/or and neither/nor, the verb agrees with the nearer subject. Collective nouns are usually singular when the group acts as one unit."],
    ["General awareness: revision method", "A short structure for making current-affairs revision easier.", "General Knowledge", "SSC CGL", "Organize current affairs by month and theme: appointments, awards, science, economy, reports and sports. Keep one factual line per item and add the source date. Review within 24 hours, again at the end of the week, and once more at month end."],
  ];
  for (const [title, description, subject, exam, body] of noteEntries) {
    await pool.query(
      `INSERT INTO notes (title, description, body, subject, exam, published)
       SELECT $1, $2, $3, $4, $5, true
       WHERE NOT EXISTS (SELECT 1 FROM notes WHERE title = $1)`,
      [title, description, body, subject, exam],
    );
  }

  const tests = [
    {
      title: "Percentage fundamentals",
      subject: "Quantitative Aptitude",
      topic: "Percentage",
      difficulty: "Easy",
      questions: [
        ["What is 20% of 500?", ["50", "100", "150", "200"], 1, "20% is one fifth; 500 ÷ 5 = 100."],
        ["35 is what percent of 140?", ["20%", "25%", "30%", "35%"], 1, "35 ÷ 140 × 100 = 25%."],
        ["A value of 80 is increased by 25%. What is the result?", ["90", "95", "100", "105"], 2, "25% of 80 is 20, so the new value is 100."],
        ["A number is reduced from 200 to 170. What is the decrease percent?", ["10%", "12%", "15%", "17%"], 2, "The decrease is 30; 30 ÷ 200 × 100 = 15%."],
      ],
    },
    {
      title: "Reasoning warm-up",
      subject: "Reasoning",
      topic: "Number series",
      difficulty: "Easy",
      questions: [
        ["Find the next number: 3, 6, 12, 24, …", ["36", "42", "48", "54"], 2, "Each term is multiplied by 2."],
        ["Find the next number: 2, 5, 10, 17, …", ["24", "25", "26", "27"], 2, "The differences are 3, 5, 7, then 9; 17 + 9 = 26."],
        ["Which number does not belong: 9, 16, 25, 36, 48?", ["16", "25", "36", "48"], 3, "The first four are consecutive perfect squares; 48 is not."],
        ["Find the next number: 1, 4, 9, 16, …", ["20", "24", "25", "36"], 2, "These are squares: 1², 2², 3², 4², then 5² = 25."],
      ],
    },
  ];

  for (const test of tests) {
    const found = await pool.query<{ id: number }>(
      "SELECT id FROM tests WHERE title = $1 LIMIT 1",
      [test.title],
    );
    let testId = found.rows[0]?.id;
    if (!testId) {
      const created = await pool.query<{ id: number }>(
        `INSERT INTO tests (title, subject, topic, question_count, duration_minutes, difficulty, published)
         VALUES ($1, $2, $3, $4, 8, $5, true) RETURNING id`,
        [test.title, test.subject, test.topic, test.questions.length, test.difficulty],
      );
      testId = created.rows[0]?.id;
    }
    if (testId) {
      for (const [index, question] of test.questions.entries()) {
        const [prompt, options, correctIndex, explanation] = question;
        await pool.query(
          `INSERT INTO test_questions
            (test_id, prompt, options, correct_index, explanation, topic, difficulty, sort_order)
           SELECT $1, $2, $3::jsonb, $4, $5, $6, $7, $8
           WHERE NOT EXISTS (SELECT 1 FROM test_questions WHERE test_id = $1 AND prompt = $2)`,
          [testId, prompt, JSON.stringify(options), correctIndex, explanation, test.topic, test.difficulty, index],
        );
      }
    }
  }
}

try {
  await seed();
  console.info("UCI sample learning content is ready.");
} finally {
  await pool.end();
}