import { pool } from "@workspace/db";
import { hashPassword } from "../src/lib/auth";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();
  const mobile = process.env.ADMIN_MOBILE?.trim();
  if (!email || !password || !name || !mobile) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, and ADMIN_MOBILE before running this command.");
  }
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  const passwordHash = await hashPassword(password);
  await pool.query(
    `INSERT INTO users (name, email, mobile, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name, mobile = EXCLUDED.mobile,
       password_hash = EXCLUDED.password_hash, role = 'admin', updated_at = NOW()`,
    [name, email, mobile, passwordHash],
  );
  console.info("Administrator account created or updated.");
}

try {
  await seedAdmin();
} finally {
  await pool.end();
}