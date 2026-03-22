import express from "express";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const pg = require("pg");
const bcrypt = require("bcrypt");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// ─── Database Pool ──────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ─── Multer (file uploads) ───────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Session store ───────────────────────────────────────────────────────────
const PgStore = connectPgSimple(session);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

app.use(session({
  store: new PgStore({ pool, tableName: "sessions" }),
  secret: process.env.SESSION_SECRET || "rejoice-ajo-secret-2026-xK9mP3nQ",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const db = (sql, params) => pool.query(sql, params);
const authRequired = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
};
const adminRequired = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  if (req.session.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
};
const adminOrModRequired = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  if (req.session.role !== "admin" && req.session.role !== "moderator") return res.status(403).json({ error: "Admin or Moderator only" });
  next();
};

const genCode = () => `RAJ-${String(Math.floor(Math.random() * 9000000) + 1000000)}`;

const addNotification = async (userId, message) => {
  await db(`INSERT INTO notifications (user_id, message) VALUES ($1, $2)`, [userId, message]);
  await db(`UPDATE users SET unread_notifications = unread_notifications + 1 WHERE id = $1`, [userId]);
};

const addAuditLog = async (action, adminId, adminName, type) => {
  await db(`INSERT INTO audit_logs (action, admin_id, admin_name, type) VALUES ($1, $2, $3, $4)`, [action, adminId, adminName, type]);
};

// ─── INIT: ensure admin password is correct ──────────────────────────────────
(async () => {
  try {
    const hash = await bcrypt.hash("Goodynessy1", 10);
    await db(`UPDATE users SET password_hash = $1 WHERE username = 'michaelvictor0014'`, [hash]);
    console.log("✅ Admin password set");
  } catch (e) {
    console.error("Admin init error:", e.message);
  }
})();

// ═════════════════════════════ AUTH ROUTES ════════════════════════════════════

// GET /api/auth/me
app.get("/api/auth/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });
  const { rows } = await db(`SELECT * FROM users WHERE id = $1`, [req.session.userId]);
  if (!rows[0]) return res.json({ user: null });
  const u = rows[0];
  res.json({
    user: {
      id: u.id, username: u.username, firstName: u.first_name, middleName: u.middle_name,
      lastName: u.last_name, email: u.email, phone: u.phone, role: u.role,
      isVip: u.is_vip, isRestricted: u.is_restricted, isBanned: u.is_banned, isFrozen: u.is_frozen,
      dob: u.dob, age: u.age, stateOfOrigin: u.state_of_origin, lga: u.lga,
      currentState: u.current_state, currentAddress: u.current_address,
      homeAddress: u.home_address, bvnNin: u.bvn_nin, nickname: u.nickname,
      totalPaid: Number(u.total_paid), unreadNotifications: u.unread_notifications,
      profilePicture: u.profile_picture,
      bankDetails: u.bank_acc_name ? { accountName: u.bank_acc_name, accountNumber: u.bank_acc_num, bankName: u.bank_name } : undefined,
      activeSlots: 0,
    }
  });
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const { rows } = await db(
      `SELECT * FROM users WHERE (username = $1 OR email = $1)`,
      [identifier]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.is_banned) return res.status(403).json({ error: "Your account has been banned. Contact support." });
    if (user.is_frozen) return res.status(403).json({ error: "Your account is temporarily frozen. Contact support." });
    // Maintenance mode: block user-role login
    if (user.role === "user") {
      const { rows: mRows } = await db(`SELECT value FROM platform_settings WHERE key='maintenance_mode'`);
      if (mRows[0]?.value === 'true') {
        return res.status(503).json({ error: "MAINTENANCE_MODE", message: "The platform is currently under scheduled maintenance. Only administrators can access the platform at this time. Please try again later." });
      }
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;
    res.json({
      user: {
        id: user.id, username: user.username, firstName: user.first_name, middleName: user.middle_name,
        lastName: user.last_name, email: user.email, phone: user.phone, role: user.role,
        isVip: user.is_vip, isRestricted: user.is_restricted, isBanned: user.is_banned, isFrozen: user.is_frozen,
        dob: user.dob, age: user.age, stateOfOrigin: user.state_of_origin, lga: user.lga,
        currentState: user.current_state, currentAddress: user.current_address,
        homeAddress: user.home_address, bvnNin: user.bvn_nin, nickname: user.nickname,
        totalPaid: Number(user.total_paid), unreadNotifications: user.unread_notifications,
        profilePicture: user.profile_picture,
        bankDetails: user.bank_acc_name ? { accountName: user.bank_acc_name, accountNumber: user.bank_acc_num, bankName: user.bank_name } : undefined,
        activeSlots: 0,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, firstName, middleName, lastName, phone,
      dob, age, stateOfOrigin, lga, currentState, currentAddress, homeAddress, bvnNin } = req.body;
    if (!username || !email || !password || !firstName || !lastName)
      return res.status(400).json({ error: "Missing required fields" });
    // Maintenance mode: block new registrations
    const { rows: mRows } = await db(`SELECT value FROM platform_settings WHERE key='maintenance_mode'`);
    if (mRows[0]?.value === 'true') {
      return res.status(503).json({ error: "MAINTENANCE_MODE", message: "New account registration is temporarily disabled during scheduled maintenance. Please try again later." });
    }
    const existing = await db(`SELECT id, username, email FROM users WHERE username = $1 OR email = $2`, [username, email]);
    if (existing.rows.length) {
      const conflict = existing.rows[0];
      const conflictType = conflict.username === username ? "username" : "email";
      return res.status(400).json({ error: "DUPLICATE_" + conflictType.toUpperCase(), message: `This ${conflictType} is already registered. Please try a different ${conflictType} or login.` });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, phone, dob, age, state_of_origin, lga, current_state, current_address, home_address, bvn_nin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [username, email, hash, firstName, middleName || null, lastName, phone || null,
       dob || null, age ? parseInt(age) : null, stateOfOrigin || null, lga || null,
       currentState || null, currentAddress || null, homeAddress || null, bvnNin || null]
    );
    const user = rows[0];
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.username = user.username;
    await addNotification(user.id, `Welcome to Rejoice Ajo, ${firstName}! Your account has been created successfully. Start exploring savings groups.`);
    res.json({
      user: {
        id: user.id, username: user.username, firstName: user.first_name, middleName: user.middle_name,
        lastName: user.last_name, email: user.email, phone: user.phone, role: user.role,
        isVip: false, isRestricted: false, isBanned: false, isFrozen: false,
        totalPaid: 0, unreadNotifications: 1, activeSlots: 0,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ═════════════════════════════ USER ROUTES ════════════════════════════════════

// GET /api/users/profile
app.get("/api/users/profile", authRequired, async (req, res) => {
  const { rows } = await db(`SELECT * FROM users WHERE id = $1`, [req.session.userId]);
  const u = rows[0];
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({
    id: u.id, username: u.username, firstName: u.first_name, middleName: u.middle_name,
    lastName: u.last_name, email: u.email, phone: u.phone, role: u.role,
    isVip: u.is_vip, isRestricted: u.is_restricted, isBanned: u.is_banned, isFrozen: u.is_frozen,
    dob: u.dob, age: u.age, stateOfOrigin: u.state_of_origin, lga: u.lga,
    currentState: u.current_state, currentAddress: u.current_address,
    homeAddress: u.home_address, bvnNin: u.bvn_nin, nickname: u.nickname,
    totalPaid: Number(u.total_paid), unreadNotifications: u.unread_notifications,
    profilePicture: u.profile_picture,
    bankDetails: u.bank_acc_name ? { accountName: u.bank_acc_name, accountNumber: u.bank_acc_num, bankName: u.bank_name } : undefined,
  });
});

// PATCH /api/users/profile
app.patch("/api/users/profile", authRequired, async (req, res) => {
  const { firstName, middleName, lastName, phone, nickname, stateOfOrigin, lga, currentState, currentAddress, homeAddress, dob, age } = req.body;
  await db(
    `UPDATE users SET first_name=$1, middle_name=$2, last_name=$3, phone=$4, nickname=$5, state_of_origin=$6, lga=$7, current_state=$8, current_address=$9, home_address=$10, dob=$11, age=$12 WHERE id=$13`,
    [firstName, middleName||null, lastName, phone||null, nickname||null, stateOfOrigin||null, lga||null, currentState||null, currentAddress||null, homeAddress||null, dob||null, age||null, req.session.userId]
  );
  res.json({ success: true });
});

// PATCH /api/users/password
app.patch("/api/users/password", authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { rows } = await db(`SELECT password_hash FROM users WHERE id = $1`, [req.session.userId]);
  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) return res.status(400).json({ error: "Current password is incorrect" });
  const hash = await bcrypt.hash(newPassword, 10);
  await db(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, req.session.userId]);
  res.json({ success: true });
});

// PATCH /api/users/email
app.patch("/api/users/email", authRequired, async (req, res) => {
  const { newEmail, password } = req.body;
  const { rows } = await db(`SELECT password_hash FROM users WHERE id = $1`, [req.session.userId]);
  const match = await bcrypt.compare(password, rows[0].password_hash);
  if (!match) return res.status(400).json({ error: "Password is incorrect" });
  const exists = await db(`SELECT id FROM users WHERE email = $1`, [newEmail]);
  if (exists.rows.length) return res.status(400).json({ error: "Email already in use" });
  await db(`UPDATE users SET email = $1 WHERE id = $2`, [newEmail, req.session.userId]);
  res.json({ success: true });
});

// PATCH /api/users/bank
app.patch("/api/users/bank", authRequired, async (req, res) => {
  const { accountName, accountNumber, bankName } = req.body;
  await db(`UPDATE users SET bank_acc_name=$1, bank_acc_num=$2, bank_name=$3 WHERE id=$4`,
    [accountName, accountNumber, bankName, req.session.userId]);
  res.json({ success: true });
});

// GET /api/users/notifications
app.get("/api/users/notifications", authRequired, async (req, res) => {
  const { rows } = await db(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.session.userId]);
  res.json(rows.map(n => ({ id: n.id, userId: n.user_id, message: n.message, read: n.read, createdAt: n.created_at })));
});

// POST /api/users/notifications/read
app.post("/api/users/notifications/read", authRequired, async (req, res) => {
  await db(`UPDATE notifications SET read = true WHERE user_id = $1`, [req.session.userId]);
  await db(`UPDATE users SET unread_notifications = 0 WHERE id = $1`, [req.session.userId]);
  res.json({ success: true });
});

// GET /api/users/transactions
app.get("/api/users/transactions", authRequired, async (req, res) => {
  const { rows } = await db(
    `SELECT p.*, g.name as group_name FROM payments p LEFT JOIN groups g ON p.group_id = g.id WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
    [req.session.userId]
  );
  res.json(rows.map(t => ({
    id: t.id, code: t.code, groupName: t.group_name || t.group_name, userId: t.user_id,
    amount: Number(t.amount), status: t.status, date: t.date, screenshotUrl: t.screenshot_url,
    seatNo: t.seat_no, groupId: t.group_id,
  })));
});

// GET /api/users/leaderboard
app.get("/api/users/leaderboard", async (req, res) => {
  const { rows } = await db(`SELECT id, username, first_name, last_name, total_paid, is_vip FROM users WHERE NOT is_banned ORDER BY total_paid DESC LIMIT 10`);
  res.json(rows.map(u => ({ id: u.id, username: u.username, firstName: u.first_name, lastName: u.last_name, totalPaid: Number(u.total_paid), isVip: u.is_vip })));
});

// ═════════════════════════════ GROUP ROUTES ══════════════════════════════════���═

// GET /api/groups
app.get("/api/groups", async (req, res) => {
  const { rows } = await db(`SELECT * FROM groups ORDER BY created_at ASC`);
  res.json(rows.map(g => ({
    id: g.id, name: g.name, description: g.description,
    contributionAmount: Number(g.contribution_amount), cycleType: g.cycle_type,
    totalSlots: g.total_slots, filledSlots: g.filled_slots,
    isLive: g.is_live, isLocked: g.is_locked, chatLocked: g.chat_locked,
    bankName: g.bank_name, accountNumber: g.account_number, accountName: g.account_name,
    termsText: g.terms_text, createdAt: g.created_at,
  })));
});

// GET /api/groups/:id
app.get("/api/groups/:id", async (req, res) => {
  const { rows } = await db(`SELECT * FROM groups WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Group not found" });
  const g = rows[0];
  res.json({
    id: g.id, name: g.name, description: g.description,
    contributionAmount: Number(g.contribution_amount), cycleType: g.cycle_type,
    totalSlots: g.total_slots, filledSlots: g.filled_slots,
    isLive: g.is_live, isLocked: g.is_locked, chatLocked: g.chat_locked,
    bankName: g.bank_name, accountNumber: g.account_number, accountName: g.account_name,
    termsText: g.terms_text, createdAt: g.created_at,
  });
});

// GET /api/groups/:id/slots
app.get("/api/groups/:id/slots", async (req, res) => {
  const { rows } = await db(
    `SELECT s.*, u.username, u.first_name, u.last_name, u.is_vip FROM slots s LEFT JOIN users u ON s.user_id = u.id WHERE s.group_id = $1 ORDER BY s.seat_no`,
    [req.params.id]
  );
  const userId = req.session?.userId;
  res.json(rows.map(s => ({
    id: s.seat_no,
    groupId: s.group_id,
    userId: s.user_id,
    username: s.username,
    fullName: s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : null,
    isVip: s.is_vip,
    status: s.user_id === userId ? "mine" : s.status,
    isDisbursed: s.is_disbursed,
    disbursedAt: s.disbursed_at,
  })));
});

// GET /api/groups/:id/members  (members list sorted by seat)
app.get("/api/groups/:id/members", async (req, res) => {
  const { rows } = await db(
    `SELECT s.seat_no, u.id as user_id, u.username, u.first_name, u.last_name, u.is_vip,
     COALESCE((SELECT status FROM payments p WHERE p.group_id = s.group_id AND p.user_id = s.user_id AND p.date = CURRENT_DATE ORDER BY p.created_at DESC LIMIT 1), 'pending') as payment_status,
     s.is_disbursed
     FROM slots s JOIN users u ON s.user_id = u.id
     WHERE s.group_id = $1 AND s.status IN ('taken','mine') AND s.user_id IS NOT NULL
     ORDER BY s.seat_no`,
    [req.params.id]
  );
  res.json(rows.map(r => ({
    seatNo: r.seat_no, userId: r.user_id, username: r.username,
    fullName: `${r.first_name} ${r.last_name}`, isVip: r.is_vip,
    paymentStatus: r.payment_status, isDisbursed: r.is_disbursed,
  })));
});

// POST /api/groups/:id/join  (join a seat)
app.post("/api/groups/:id/join", authRequired, async (req, res) => {
  try {
    const { seatNo } = req.body;
    const groupId = req.params.id;
    const userId = req.session.userId;
    if (!seatNo) return res.status(400).json({ error: "Seat number required" });
    const { rows: group } = await db(`SELECT * FROM groups WHERE id = $1`, [groupId]);
    if (!group[0]) return res.status(404).json({ error: "Group not found" });
    if (group[0].is_locked) return res.status(400).json({ error: "Group is locked" });
    const { rows: user } = await db(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (user[0]?.is_banned || user[0]?.is_frozen || user[0]?.is_restricted)
      return res.status(403).json({ error: "Your account is restricted. Contact support." });
    const { rows: slot } = await db(`SELECT * FROM slots WHERE group_id = $1 AND seat_no = $2`, [groupId, seatNo]);
    if (!slot[0]) return res.status(404).json({ error: "Seat not found" });
    if (slot[0].status !== "available") return res.status(400).json({ error: "Seat is not available" });
    await db(`UPDATE slots SET status='taken', user_id=$1 WHERE group_id=$2 AND seat_no=$3`, [userId, groupId, seatNo]);
    await db(`UPDATE groups SET filled_slots = filled_slots + 1 WHERE id = $1`, [groupId]);
    const groupName = group[0].name;
    await addNotification(userId, `Dear ${user[0].first_name}, you have successfully joined seat #${seatNo} in ${groupName}. Welcome to the circle!`);
    await addAuditLog(`${user[0].username} joined seat #${seatNo} in ${groupName}`, null, "system", "join");
    res.json({ success: true, message: `Successfully joined seat #${seatNo}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/:id/exit  (exit request)
app.post("/api/groups/:id/exit", authRequired, async (req, res) => {
  const { reason } = req.body;
  const { rows: user } = await db(`SELECT * FROM users WHERE id = $1`, [req.session.userId]);
  const { rows: group } = await db(`SELECT name FROM groups WHERE id = $1`, [req.params.id]);
  await db(`INSERT INTO exit_requests (user_id, username, group_id, reason) VALUES ($1, $2, $3, $4)`,
    [req.session.userId, user[0]?.username, req.params.id, reason || "Personal reasons"]);
  await addNotification(req.session.userId, `Your exit request from ${group[0]?.name} has been submitted. Admin will review it shortly.`);
  res.json({ success: true });
});

// POST /api/groups/:id/payment  (submit payment)
app.post("/api/groups/:id/payment", authRequired, upload.single("screenshot"), async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.session.userId;
    const { seatNo } = req.body;
    const { rows: group } = await db(`SELECT * FROM groups WHERE id = $1`, [groupId]);
    if (!group[0]) return res.status(404).json({ error: "Group not found" });
    const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const code = genCode();
    const { rows } = await db(
      `INSERT INTO payments (code, group_id, group_name, seat_no, user_id, amount, status, screenshot_url)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
      [code, groupId, group[0].name, seatNo || null, userId, group[0].contribution_amount, screenshotUrl]
    );
    const { rows: user } = await db(`SELECT first_name, username FROM users WHERE id = $1`, [userId]);
    await addNotification(userId, `Dear ${user[0].first_name}, your payment ${code} of ₦${Number(group[0].contribution_amount).toLocaleString()} for ${group[0].name} has been submitted and is pending admin approval.`);
    res.json({ success: true, code, payment: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id/chat
app.get("/api/groups/:id/chat", authRequired, async (req, res) => {
  const { rows } = await db(
    `SELECT * FROM chat_messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 100`,
    [req.params.id]
  );
  res.json(rows.map(m => ({ id: m.id, username: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) })));
});

// POST /api/groups/:id/chat
app.post("/api/groups/:id/chat", authRequired, async (req, res) => {
  const { text } = req.body;
  const { rows: group } = await db(`SELECT chat_locked FROM groups WHERE id = $1`, [req.params.id]);
  if (group[0]?.chat_locked && req.session.role !== "admin") return res.status(403).json({ error: "Chat is locked" });
  const { rows } = await db(
    `INSERT INTO chat_messages (group_id, user_id, username, text) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.id, req.session.userId, req.session.username, text]
  );
  const m = rows[0];
  res.json({ id: m.id, username: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) });
});

// ═════════════════════════════ ANNOUNCEMENT ROUTES ════════════════════════════

// GET /api/announcements
app.get("/api/announcements", async (req, res) => {
  const { rows } = await db(`SELECT * FROM announcements ORDER BY created_at DESC`);
  res.json(rows.map(a => ({
    id: a.id, title: a.title, body: a.body, type: a.type,
    imageUrl: a.image_url, videoUrl: a.video_url, targetGroupId: a.target_group_id,
    adminName: a.admin_name, createdAt: a.created_at,
  })));
});

// POST /api/announcements (admin/mod - with image and optional video)
app.post("/api/announcements", adminOrModRequired, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, body, type, targetGroupId } = req.body;
    const files = req.files as { [key: string]: Express.Multer.File[] };
    
    const imageUrl = files?.image?.[0] ? `/uploads/${files.image[0].filename}` : req.body.imageUrl || null;
    const videoUrl = files?.video?.[0] ? `/uploads/${files.video[0].filename}` : req.body.videoUrl || null;
    
    if (!imageUrl && !title) return res.status(400).json({ error: "Title and at least an image are required" });
    
    const { rows } = await db(
      `INSERT INTO announcements (title, body, type, image_url, video_url, target_group_id, admin_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, body, type || "announcement", imageUrl, videoUrl, targetGroupId || null, req.session.username]
    );
    const a = rows[0];
    res.json({ 
      success: true,
      announcement: {
        id: a.id, title: a.title, body: a.body, type: a.type, 
        imageUrl: a.image_url, videoUrl: a.video_url, targetGroupId: a.target_group_id, 
        adminName: a.admin_name, createdAt: a.created_at
      }
    });
  } catch (err) {
    console.error("Announcement creation error:", err);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// DELETE /api/announcements/:id
app.delete("/api/announcements/:id", adminOrModRequired, async (req, res) => {
  try {
    await db(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Announcement deletion error:", err);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// ═════════════════════════════ SUPPORT TICKET ROUTES ══════════════════════════

// GET /api/support
app.get("/api/support", authRequired, async (req, res) => {
  const isAdminOrMod = req.session.role === "admin" || req.session.role === "moderator";
  const { rows } = isAdminOrMod
    ? await db(`SELECT * FROM support_tickets ORDER BY created_at DESC`)
    : await db(`SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`, [req.session.userId]);
  res.json(rows.map(t => ({
    id: t.id, userId: t.user_id, username: t.username, subject: t.subject,
    message: t.message, status: t.status, adminReply: t.admin_reply,
    repliedAt: t.replied_at, createdAt: t.created_at,
  })));
});

// POST /api/support
app.post("/api/support", authRequired, async (req, res) => {
  const { subject, message } = req.body;
  const { rows: user } = await db(`SELECT username FROM users WHERE id = $1`, [req.session.userId]);
  const { rows } = await db(
    `INSERT INTO support_tickets (user_id, username, subject, message) VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.session.userId, user[0]?.username, subject, message]
  );
  res.json({ success: true, ticket: rows[0] });
});

// PATCH /api/support/:id/reply
app.patch("/api/support/:id/reply", adminOrModRequired, async (req, res) => {
  const { reply } = req.body;
  const { rows } = await db(
    `UPDATE support_tickets SET admin_reply=$1, status='replied', replied_at=NOW() WHERE id=$2 RETURNING user_id, subject`,
    [reply, req.params.id]
  );
  if (rows[0]) {
    await addNotification(rows[0].user_id, `Your support ticket "${rows[0].subject}" has received a reply from admin. Check your tickets for the response.`);
  }
  res.json({ success: true });
});

// PATCH /api/support/:id/close
app.patch("/api/support/:id/close", adminOrModRequired, async (req, res) => {
  await db(`UPDATE support_tickets SET status='closed' WHERE id=$1`, [req.params.id]);
  res.json({ success: true });
});

// ═════════════════════════════ CONTACT INFO ════════════════════════════════════

// GET /api/contact
app.get("/api/contact", async (req, res) => {
  try {
    const { rows } = await db(`SELECT * FROM contact_info WHERE id = 1`);
    const c = rows[0] || {};
    res.json({ whatsapp: c.whatsapp || "", facebook: c.facebook || "", email: c.email || "", callNumber: c.call_number || "", smsNumber: c.sms_number || "" });
  } catch (err) {
    console.error("Contact fetch error:", err);
    res.status(500).json({ error: "Failed to fetch contact information" });
  }
});

// PUT /api/contact (admin)
app.put("/api/contact", adminRequired, async (req, res) => {
  try {
    const { whatsapp, facebook, email, callNumber, smsNumber } = req.body;
    await db(
      `INSERT INTO contact_info (id, whatsapp, facebook, email, call_number, sms_number) VALUES (1,$1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET whatsapp=$1, facebook=$2, email=$3, call_number=$4, sms_number=$5, updated_at=CURRENT_TIMESTAMP`,
      [whatsapp || "", facebook || "", email || "", callNumber || "", smsNumber || ""]
    );
    res.json({ success: true, message: "Contact information updated successfully" });
  } catch (err) {
    console.error("Contact update error:", err);
    res.status(500).json({ error: "Failed to update contact information" });
  }
});

// ═════════════════════════════ ADMIN ROUTES ════════════════════════════════════

// GET /api/admin/users
app.get("/api/admin/users", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT * FROM users ORDER BY created_at ASC`);
  res.json(rows.map(u => ({
    id: u.id, username: u.username, email: u.email,
    fullName: `${u.first_name} ${u.last_name}`, firstName: u.first_name, lastName: u.last_name,
    phone: u.phone, dob: u.dob, state: u.current_state, lga: u.lga, address: u.current_address,
    trustScore: u.trust_score || 50, status: u.is_banned ? "banned" : u.is_frozen ? "frozen" : u.is_restricted ? "restricted" : "active",
    isVip: u.is_vip, role: u.role, isBanned: u.is_banned, isFrozen: u.is_frozen, isRestricted: u.is_restricted,
    bankAccName: u.bank_acc_name, bankAccNum: u.bank_acc_num, bankName: u.bank_name,
    totalPaid: Number(u.total_paid), createdAt: u.created_at,
  })));
});

// PATCH /api/admin/users/:id
app.patch("/api/admin/users/:id", adminRequired, async (req, res) => {
  const { action, fullName, email, phone, dob, state, lga, address, username, role, newPassword, trustScore } = req.body;
  const userId = req.params.id;
  const { rows: usr } = await db(`SELECT * FROM users WHERE id = $1`, [userId]);
  const u = usr[0];
  if (!u) return res.status(404).json({ error: "User not found" });
  if (action) {
    switch (action) {
      case "ban":        await db(`UPDATE users SET is_banned=true WHERE id=$1`, [userId]); break;
      case "unban":      await db(`UPDATE users SET is_banned=false WHERE id=$1`, [userId]); break;
      case "freeze":     await db(`UPDATE users SET is_frozen=true WHERE id=$1`, [userId]); break;
      case "unfreeze":   await db(`UPDATE users SET is_frozen=false WHERE id=$1`, [userId]); break;
      case "restrict":   await db(`UPDATE users SET is_restricted=true WHERE id=$1`, [userId]); break;
      case "unrestrict": await db(`UPDATE users SET is_restricted=false WHERE id=$1`, [userId]); break;
      case "vip":        await db(`UPDATE users SET is_vip=NOT is_vip WHERE id=$1`, [userId]); break;
      case "moderator":  await db(`UPDATE users SET role=CASE WHEN role='moderator' THEN 'user' ELSE 'moderator' END WHERE id=$1`, [userId]); break;
      case "trustScore":
        if (trustScore !== undefined && trustScore !== null) {
          const score = Math.max(0, Math.min(100, parseInt(trustScore)));
          await db(`UPDATE users SET trust_score=$1 WHERE id=$2`, [score, userId]);
          await addNotification(userId, `Your trust score has been manually set to ${score} by admin.`);
          await addAuditLog(`Admin ${req.session.username} set trust score to ${score} for user ${u.username}`, req.session.userId, req.session.username, "trust_score");
        }
        break;
      case "resetPassword":
        if (newPassword) {
          const hash = await bcrypt.hash(newPassword, 10);
          await db(`UPDATE users SET password_hash=$1 WHERE id=$2`, [hash, userId]);
          await addNotification(userId, `Your password has been reset by admin. Please update it in your profile.`);
        }
        break;
    }
    if (action !== "trustScore") {
      await addAuditLog(`Admin ${req.session.username} performed '${action}' on user ${u.username}`, req.session.userId, req.session.username, action);
    }
  } else {
    const [fn, ln] = (fullName || `${u.first_name} ${u.last_name}`).split(" ");
    await db(
      `UPDATE users SET first_name=$1, last_name=$2, email=$3, phone=$4, dob=$5, current_state=$6, lga=$7, current_address=$8, username=$9
       WHERE id=$10`,
      [fn, ln || "", email || u.email, phone || u.phone, dob || u.dob, state || u.current_state, lga || u.lga, address || u.current_address, username || u.username, userId]
    );
    await addAuditLog(`Admin ${req.session.username} edited profile of user ${u.username}`, req.session.userId, req.session.username, "edit");
  }
  res.json({ success: true });
});

// GET /api/admin/payments
app.get("/api/admin/payments", adminRequired, async (req, res) => {
  const { rows } = await db(
    `SELECT p.*, u.username, u.first_name, u.last_name FROM payments p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`
  );
  res.json(rows.map(p => ({
    id: p.id, code: p.code, user: p.username, fullName: `${p.first_name} ${p.last_name}`,
    group: p.group_name, groupId: p.group_id, amount: Number(p.amount), date: p.date,
    status: p.status, screenshotUrl: p.screenshot_url, seatNo: p.seat_no, userId: p.user_id,
  })));
});

// PATCH /api/admin/payments/:id
app.patch("/api/admin/payments/:id", adminRequired, async (req, res) => {
  const { status } = req.body;
  const { rows } = await db(`UPDATE payments SET status=$1 WHERE id=$2 RETURNING *`, [status, req.params.id]);
  const p = rows[0];
  if (!p) return res.status(404).json({ error: "Payment not found" });
  if (status === "approved") {
    const amount = Number(p.amount);
    await db(`UPDATE users SET total_paid = total_paid + $1 WHERE id = $2`, [amount, p.user_id]);
    const { rows: user } = await db(`SELECT first_name FROM users WHERE id = $1`, [p.user_id]);
    await addNotification(p.user_id, `Dear ${user[0]?.first_name}, your payment ${p.code} of ₦${amount.toLocaleString()} for ${p.group_name} (Seat #${p.seat_no}) has been APPROVED. Thank you!`);
    await addAuditLog(`Payment ${p.code} approved for user_id ${p.user_id}`, req.session.userId, req.session.username, "approve");
  } else if (status === "declined") {
    const { rows: user } = await db(`SELECT first_name FROM users WHERE id = $1`, [p.user_id]);
    await addNotification(p.user_id, `Dear ${user[0]?.first_name}, your payment ${p.code} of ₦${Number(p.amount).toLocaleString()} for ${p.group_name} has been DECLINED. Please contact admin for assistance.`);
    await addAuditLog(`Payment ${p.code} declined for user_id ${p.user_id}`, req.session.userId, req.session.username, "decline");
  }
  res.json({ success: true });
});

// GET /api/admin/groups
app.get("/api/admin/groups", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT * FROM groups ORDER BY created_at ASC`);
  res.json(rows.map(g => ({ id: g.id, name: g.name, description: g.description, contributionAmount: Number(g.contribution_amount), cycleType: g.cycle_type, totalSlots: g.total_slots, filledSlots: g.filled_slots, isLive: g.is_live, isLocked: g.is_locked, chatLocked: g.chat_locked, bankName: g.bank_name, accountNumber: g.account_number, accountName: g.account_name, termsText: g.terms_text, createdAt: g.created_at })));
});

// POST /api/admin/groups
app.post("/api/admin/groups", adminRequired, async (req, res) => {
  const { name, description, contributionAmount, cycleType, totalSlots, bankName, accountNumber, accountName, termsText } = req.body;
  const slots = totalSlots || 100;
  const { rows } = await db(
    `INSERT INTO groups (name, description, contribution_amount, cycle_type, total_slots, bank_name, account_number, account_name, terms_text) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [name, description, contributionAmount, cycleType, slots, bankName, accountNumber, accountName, termsText]
  );
  const g = rows[0];
  // Create all slots as available
  for (let i = 1; i <= slots; i++) {
    await db(`INSERT INTO slots (group_id, seat_no, status) VALUES ($1, $2, 'available')`, [g.id, i]);
  }
  await addAuditLog(`Admin created new group: ${name}`, req.session.userId, req.session.username, "create");
  res.json({ success: true, group: { id: g.id, name: g.name } });
});

// PATCH /api/admin/groups/:id
app.patch("/api/admin/groups/:id", adminRequired, async (req, res) => {
  const { action, name, description, contributionAmount, cycleType, bankName, accountNumber, accountName, termsText, chatLocked } = req.body;
  const groupId = req.params.id;
  if (action === "live") {
    await db(`UPDATE groups SET is_live = NOT is_live WHERE id = $1`, [groupId]);
    const { rows } = await db(`SELECT name, is_live FROM groups WHERE id = $1`, [groupId]);
    // Notify all group members
    const { rows: members } = await db(`SELECT DISTINCT user_id FROM slots WHERE group_id = $1 AND user_id IS NOT NULL`, [groupId]);
    for (const m of members) {
      await addNotification(m.user_id, `${rows[0].name} has gone ${rows[0].is_live ? "LIVE" : "inactive"}! ${rows[0].is_live ? "Start making your contributions now." : ""}`);
    }
    await addAuditLog(`Group ${rows[0].name} set to ${rows[0].is_live ? "LIVE" : "inactive"}`, req.session.userId, req.session.username, "live");
  } else if (action === "lock") {
    await db(`UPDATE groups SET is_locked = NOT is_locked WHERE id = $1`, [groupId]);
  } else if (action === "chatLock") {
    await db(`UPDATE groups SET chat_locked = NOT chat_locked WHERE id = $1`, [groupId]);
  } else if (action === "lockSeat") {
    const { seatNo, lock } = req.body;
    await db(`UPDATE slots SET status=$1 WHERE group_id=$2 AND seat_no=$3`, [lock ? "locked" : "available", groupId, seatNo]);
  } else {
    await db(`UPDATE groups SET name=$1, description=$2, contribution_amount=$3, cycle_type=$4, bank_name=$5, account_number=$6, account_name=$7, terms_text=$8 WHERE id=$9`,
      [name, description, contributionAmount, cycleType, bankName, accountNumber, accountName, termsText, groupId]);
    await addAuditLog(`Group ${name} updated by admin`, req.session.userId, req.session.username, "edit");
  }
  res.json({ success: true });
});

// POST /api/admin/groups/:id/disburse/:seatNo
app.post("/api/admin/groups/:id/disburse/:seatNo", adminRequired, async (req, res) => {
  const { id: groupId, seatNo } = req.params;
  const { rows: slot } = await db(`SELECT * FROM slots WHERE group_id=$1 AND seat_no=$2`, [groupId, parseInt(seatNo)]);
  if (!slot[0] || !slot[0].user_id) return res.status(404).json({ error: "Seat not found or not occupied" });
  await db(`UPDATE slots SET is_disbursed=true, disbursed_at=NOW(), disbursed_by=$1 WHERE group_id=$2 AND seat_no=$3`,
    [req.session.userId, groupId, parseInt(seatNo)]);
  const { rows: group } = await db(`SELECT name, contribution_amount, total_slots FROM groups WHERE id=$1`, [groupId]);
  const totalPayout = Number(group[0].contribution_amount) * group[0].total_slots;
  const { rows: user } = await db(`SELECT first_name, username FROM users WHERE id=$1`, [slot[0].user_id]);
  await addNotification(slot[0].user_id, `Dear ${user[0].first_name}, your disbursement for Seat #${seatNo} in ${group[0].name} has been processed! Total payout: ₦${totalPayout.toLocaleString()}. Check your bank account.`);
  await addAuditLog(`Disbursement made to ${user[0].username} for seat #${seatNo} in ${group[0].name}`, req.session.userId, req.session.username, "disburse");
  res.json({ success: true });
});

// GET /api/admin/defaulters
app.get("/api/admin/defaulters", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT d.*, g.name as group_name FROM defaulters d LEFT JOIN groups g ON d.group_id = g.id WHERE NOT d.is_removed ORDER BY d.created_at DESC`);
  res.json(rows.map(d => ({ id: d.id, user: d.username, userId: d.user_id, group: d.group_name, groupId: d.group_id, seatNo: d.seat_no, since: d.since, count: d.count, amount: `₦${Number(d.amount).toLocaleString()}` })));
});

// DELETE /api/admin/defaulters/:id
app.delete("/api/admin/defaulters/:id", adminRequired, async (req, res) => {
  await db(`UPDATE defaulters SET is_removed=true WHERE id=$1`, [req.params.id]);
  res.json({ success: true });
});

// POST /api/admin/defaulters  (manually add defaulter)
app.post("/api/admin/defaulters", adminRequired, async (req, res) => {
  const { userId, groupId, seatNo, amount } = req.body;
  const { rows: user } = await db(`SELECT username, first_name FROM users WHERE id=$1`, [userId]);
  if (!user[0]) return res.status(404).json({ error: "User not found" });
  const { rows: group } = await db(`SELECT name FROM groups WHERE id=$1`, [groupId]);
  await db(`INSERT INTO defaulters (user_id, username, group_id, seat_no, amount) VALUES ($1,$2,$3,$4,$5)`,
    [userId, user[0].username, groupId, seatNo, amount || 0]);
  await addNotification(userId, `Dear ${user[0].first_name}, you have been marked as a DEFAULTER for failing to pay for Seat #${seatNo} in ${group[0]?.name}. Please contact admin immediately.`);
  await addAuditLog(`${user[0].username} marked as defaulter for seat #${seatNo} in ${group[0]?.name}`, req.session.userId, req.session.username, "restrict");
  res.json({ success: true });
});

// GET /api/admin/exit-requests
app.get("/api/admin/exit-requests", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT e.*, g.name as group_name FROM exit_requests e LEFT JOIN groups g ON e.group_id = g.id ORDER BY e.created_at DESC`);
  res.json(rows.map(e => ({ id: e.id, user: e.username, group: e.group_name, reason: e.reason, status: e.status, date: e.created_at })));
});

// PATCH /api/admin/exit-requests/:id
app.patch("/api/admin/exit-requests/:id", adminRequired, async (req, res) => {
  const { status } = req.body;
  const { rows } = await db(`UPDATE exit_requests SET status=$1 WHERE id=$2 RETURNING user_id, group_id`, [status, req.params.id]);
  if (rows[0] && status === "approved") {
    // Remove all user's slots in that group
    const { rows: slots } = await db(`SELECT seat_no FROM slots WHERE group_id=$1 AND user_id=$2`, [rows[0].group_id, rows[0].user_id]);
    await db(`UPDATE slots SET status='available', user_id=NULL WHERE group_id=$1 AND user_id=$2`, [rows[0].group_id, rows[0].user_id]);
    await db(`UPDATE groups SET filled_slots = filled_slots - $1 WHERE id=$2`, [slots.length, rows[0].group_id]);
    await addNotification(rows[0].user_id, `Your exit request has been approved. You have been removed from the group.`);
  }
  res.json({ success: true });
});

// GET /api/admin/seat-changes
app.get("/api/admin/seat-changes", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT sc.*, g.name as group_name FROM seat_changes sc LEFT JOIN groups g ON sc.group_id = g.id ORDER BY sc.created_at DESC`);
  res.json(rows.map(s => ({ id: s.id, user: s.username, group: s.group_name, from: s.from_seat, to: s.to_seat, reason: s.reason, status: s.status, time: s.created_at })));
});

// PATCH /api/admin/seat-changes/:id
app.patch("/api/admin/seat-changes/:id", adminRequired, async (req, res) => {
  const { status } = req.body;
  const { rows } = await db(`UPDATE seat_changes SET status=$1 WHERE id=$2 RETURNING *`, [status, req.params.id]);
  if (rows[0] && status === "approved") {
    const sc = rows[0];
    // Perform the seat swap
    await db(`UPDATE slots SET user_id=NULL, status='available' WHERE group_id=$1 AND seat_no=$2`, [sc.group_id, sc.from_seat]);
    const { rows: toSlot } = await db(`SELECT status FROM slots WHERE group_id=$1 AND seat_no=$2`, [sc.group_id, sc.to_seat]);
    if (toSlot[0]?.status === "available") {
      await db(`UPDATE slots SET user_id=$1, status='taken', username=$2 WHERE group_id=$3 AND seat_no=$4`, [sc.user_id, sc.username, sc.group_id, sc.to_seat]);
    }
    await addNotification(sc.user_id, `Your seat change request from Seat #${sc.from_seat} to Seat #${sc.to_seat} has been approved!`);
  }
  res.json({ success: true });
});

// GET /api/admin/audit-logs
app.get("/api/admin/audit-logs", adminRequired, async (req, res) => {
  const { rows } = await db(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
  res.json(rows.map(a => ({ id: a.id, action: a.action, admin: a.admin_name || "system", time: a.created_at, type: a.type })));
});

// GET /api/admin/overview-stats
app.get("/api/admin/overview-stats", adminRequired, async (req, res) => {
  const [users, groups, payments, tickets, defaulters] = await Promise.all([
    db(`SELECT COUNT(*) FROM users WHERE NOT is_banned`),
    db(`SELECT COUNT(*) FROM groups WHERE is_live`),
    db(`SELECT COUNT(*) FROM payments WHERE status='pending'`),
    db(`SELECT COUNT(*) FROM support_tickets WHERE status='open'`),
    db(`SELECT COUNT(*) FROM defaulters WHERE NOT is_removed`),
  ]);
  res.json({
    totalUsers: parseInt(users.rows[0].count),
    activeGroups: parseInt(groups.rows[0].count),
    pendingPayments: parseInt(payments.rows[0].count),
    openTickets: parseInt(tickets.rows[0].count),
    totalDefaulters: parseInt(defaulters.rows[0].count),
  });
});

// POST /api/admin/reminder (send notification to user or all)
app.post("/api/admin/reminder", adminRequired, async (req, res) => {
  const { target, message } = req.body;
  if (target === "all") {
    const { rows: users } = await db(`SELECT id FROM users WHERE NOT is_banned`);
    for (const u of users) await addNotification(u.id, message);
  } else {
    const { rows } = await db(`SELECT id FROM users WHERE username=$1 OR email=$1`, [target]);
    if (rows[0]) await addNotification(rows[0].id, message);
  }
  await addAuditLog(`Admin sent reminder: "${message}" to ${target}`, req.session.userId, req.session.username, "announce");
  res.json({ success: true });
});

// ─── Seat change request (user) ──────────────────────────────────────────────
app.post("/api/groups/:id/seat-change", authRequired, async (req, res) => {
  const { fromSeat, toSeat, reason } = req.body;
  const { rows: user } = await db(`SELECT username FROM users WHERE id=$1`, [req.session.userId]);
  await db(`INSERT INTO seat_changes (user_id, username, group_id, from_seat, to_seat, reason) VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.session.userId, user[0].username, req.params.id, fromSeat, toSeat, reason]);
  await addNotification(req.session.userId, `Your seat change request from Seat #${fromSeat} to Seat #${toSeat} has been submitted. Admin will review it shortly.`);
  res.json({ success: true });
});

// ─── Mark defaulters for missed daily payments (called by admin or scheduled) ─
app.post("/api/admin/check-defaulters", adminRequired, async (req, res) => {
  const { groupId } = req.body;
  // Find members who haven't paid today
  const { rows: members } = await db(
    `SELECT s.user_id, s.seat_no, u.username, u.first_name, g.name as group_name, g.contribution_amount
     FROM slots s
     JOIN users u ON s.user_id = u.id
     JOIN groups g ON s.group_id = g.id
     WHERE s.group_id = $1 AND g.is_live = true AND s.status = 'taken'
     AND s.user_id NOT IN (
       SELECT user_id FROM payments WHERE group_id = $1 AND date = CURRENT_DATE AND status IN ('approved', 'pending')
     )`,
    [groupId]
  );
  let count = 0;
  for (const m of members) {
    await db(`INSERT INTO defaulters (user_id, username, group_id, seat_no, amount) VALUES ($1,$2,$3,$4,$5)`,
      [m.user_id, m.username, groupId, m.seat_no, m.contribution_amount]);
    await db(`UPDATE defaulters SET count = count + 1 WHERE user_id=$1 AND group_id=$2 AND NOT is_removed`, [m.user_id, groupId]);
    await addNotification(m.user_id, `Dear ${m.first_name}, you have been marked as a DEFAULTER for missing your payment for Seat #${m.seat_no} in ${m.group_name} today. Please pay immediately to avoid further consequences.`);
    count++;
  }
  await addAuditLog(`Defaulter check run for group: ${members[0]?.group_name || groupId} — ${count} defaulters found`, req.session.userId, req.session.username, "restrict");
  res.json({ success: true, count });
});

// ─── Maintenance mode ─────────────────────────────────────────────────────────
app.get("/api/maintenance", async (req, res) => {
  const { rows } = await db(`SELECT value FROM platform_settings WHERE key='maintenance_mode'`);
  res.json({ enabled: rows[0]?.value === 'true' });
});

app.post("/api/admin/maintenance", adminRequired, async (req, res) => {
  const { enabled } = req.body;
  await db(`UPDATE platform_settings SET value=$1, updated_at=NOW() WHERE key='maintenance_mode'`, [enabled ? 'true' : 'false']);
  await addAuditLog(`Platform maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`, req.session.userId, req.session.username, enabled ? 'lock' : 'announce');
  res.json({ success: true, enabled });
});

// ─── User activity/history ────────────────────────────────────────────────────
app.get("/api/users/history", authRequired, async (req, res) => {
  const userId = req.session.userId;
  // Combine payments, slot joins, and notifications into a unified history feed
  const [payments, slots, notifs] = await Promise.all([
    db(`SELECT p.id, p.code, p.amount, p.status, p.date, p.created_at, g.name as group_name, p.seat_no
        FROM payments p LEFT JOIN groups g ON p.group_id = g.id
        WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 50`, [userId]),
    db(`SELECT s.seat_no, s.created_at, g.name as group_name, g.id as group_id
        FROM slots s JOIN groups g ON s.group_id = g.id
        WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 30`, [userId]),
    db(`SELECT id, message, read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`, [userId]),
  ]);
  const history = [
    ...payments.rows.map(p => ({ id: `pay-${p.id}`, type: 'payment', title: `Payment ${p.code}`, description: `₦${Number(p.amount).toLocaleString()} for ${p.group_name} — Seat #${p.seat_no || '?'}`, status: p.status, createdAt: p.created_at })),
    ...slots.rows.map(s => ({ id: `slot-${s.group_id}-${s.seat_no}`, type: 'join', title: `Joined ${s.group_name}`, description: `Seat #${s.seat_no} in ${s.group_name}`, status: 'info', createdAt: s.created_at })),
    ...notifs.rows.map(n => ({ id: `notif-${n.id}`, type: 'notification', title: 'Notification', description: n.message, status: n.read ? 'read' : 'unread', createdAt: n.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 80);
  res.json(history);
});

// ─── Admin: view specific user's history ──────────────────────────────────────
app.get("/api/admin/users/:id/history", adminRequired, async (req, res) => {
  const userId = req.params.id;
  const [payments, slots, notifs] = await Promise.all([
    db(`SELECT p.id, p.code, p.amount, p.status, p.date, p.created_at, g.name as group_name, p.seat_no
        FROM payments p LEFT JOIN groups g ON p.group_id = g.id
        WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT 50`, [userId]),
    db(`SELECT s.seat_no, s.created_at, g.name as group_name, g.id as group_id
        FROM slots s JOIN groups g ON s.group_id = g.id
        WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 30`, [userId]),
    db(`SELECT id, message, read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`, [userId]),
  ]);
  const history = [
    ...payments.rows.map(p => ({ id: `pay-${p.id}`, type: 'payment', title: `Payment ${p.code}`, description: `₦${Number(p.amount).toLocaleString()} for ${p.group_name} — Seat #${p.seat_no || '?'}`, status: p.status, createdAt: p.created_at })),
    ...slots.rows.map(s => ({ id: `slot-${s.group_id}-${s.seat_no}`, type: 'join', title: `Joined ${s.group_name}`, description: `Seat #${s.seat_no} in ${s.group_name}`, status: 'info', createdAt: s.created_at })),
    ...notifs.rows.map(n => ({ id: `notif-${n.id}`, type: 'notification', title: 'Notification', description: n.message, status: n.read ? 'read' : 'unread', createdAt: n.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 80);
  res.json(history);
});

// ─── Support: allow file attachment upload ────────────────────────────────────
app.post("/api/support/with-attachment", authRequired, upload.single("attachment"), async (req, res) => {
  const { subject, message } = req.body;
  const { rows: user } = await db(`SELECT username FROM users WHERE id = $1`, [req.session.userId]);
  const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const { rows } = await db(
    `INSERT INTO support_tickets (user_id, username, subject, message, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.session.userId, user[0]?.username, subject, message, attachmentUrl]
  );
  res.json({ success: true, ticket: rows[0] });
});

// ─── Seat Removal Requests ────────────────────────────────────────────────────────
// POST /api/seat-removal (user requests to remove a specific seat)
app.post("/api/seat-removal", authRequired, async (req, res) => {
  try {
    const { groupId, seatNumber, reason } = req.body;
    if (!groupId || !seatNumber) return res.status(400).json({ error: "Missing groupId or seatNumber" });
    
    // Check if user has this seat
    const { rows: slot } = await db(
      `SELECT * FROM slots WHERE group_id=$1 AND seat_no=$2 AND user_id=$3`,
      [groupId, seatNumber, req.session.userId]
    );
    if (!slot[0]) return res.status(404).json({ error: "You do not have this seat" });
    
    // Check if request already exists
    const { rows: existing } = await db(
      `SELECT id FROM seat_removal_requests WHERE user_id=$1 AND group_id=$2 AND seat_number=$3 AND status='pending'`,
      [req.session.userId, groupId, seatNumber]
    );
    if (existing.length) return res.status(400).json({ error: "You already have a pending request for this seat" });
    
    // Create removal request
    const { rows } = await db(
      `INSERT INTO seat_removal_requests (user_id, group_id, seat_number, reason, status) VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
      [req.session.userId, groupId, seatNumber, reason || ""]
    );
    
    // Notify admins
    const { rows: admins } = await db(`SELECT id, first_name FROM users WHERE role='admin'`);
    const { rows: userInfo } = await db(`SELECT username FROM users WHERE id=$1`, [req.session.userId]);
    const { rows: groupInfo } = await db(`SELECT name FROM groups WHERE id=$1`, [groupId]);
    
    for (const admin of admins) {
      await addNotification(admin.id, `Seat removal request: ${userInfo[0]?.username} requested to remove Seat #${seatNumber} from ${groupInfo[0]?.name}. Reason: ${reason || "None provided"}`);
    }
    
    res.json({ success: true, request: rows[0], message: "Removal request submitted. Admin will review shortly." });
  } catch (err) {
    console.error("Seat removal error:", err);
    res.status(500).json({ error: "Failed to submit removal request" });
  }
});

// GET /api/seat-removal (get user's removal requests)
app.get("/api/seat-removal", authRequired, async (req, res) => {
  try {
    const { rows } = await db(
      `SELECT sr.*, g.name as group_name FROM seat_removal_requests sr 
       LEFT JOIN groups g ON sr.group_id = g.id 
       WHERE sr.user_id=$1 ORDER BY sr.requested_at DESC`,
      [req.session.userId]
    );
    res.json(rows.map(r => ({
      id: r.id,
      groupId: r.group_id,
      groupName: r.group_name,
      seatNumber: r.seat_number,
      reason: r.reason,
      status: r.status,
      requestedAt: r.requested_at,
      adminResponse: r.admin_response,
      respondedAt: r.responded_at,
    })));
  } catch (err) {
    console.error("Fetch removal requests error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// GET /api/admin/seat-removal (admin views all removal requests)
app.get("/api/admin/seat-removal", adminRequired, async (req, res) => {
  try {
    const { rows } = await db(
      `SELECT sr.*, g.name as group_name, u.username FROM seat_removal_requests sr 
       LEFT JOIN groups g ON sr.group_id = g.id
       LEFT JOIN users u ON sr.user_id = u.id
       ORDER BY sr.requested_at DESC`
    );
    res.json(rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      groupId: r.group_id,
      groupName: r.group_name,
      seatNumber: r.seat_number,
      reason: r.reason,
      status: r.status,
      requestedAt: r.requested_at,
      adminResponse: r.admin_response,
      respondedAt: r.responded_at,
    })));
  } catch (err) {
    console.error("Admin fetch removal requests error:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// PATCH /api/admin/seat-removal/:id (admin approve/reject)
app.patch("/api/admin/seat-removal/:id", adminRequired, async (req, res) => {
  try {
    const { status, response } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    
    const { rows } = await db(
      `UPDATE seat_removal_requests SET status=$1, admin_response=$2, responded_at=NOW() WHERE id=$3 RETURNING user_id, group_id, seat_number`,
      [status, response || "", req.params.id]
    );
    
    if (rows[0]) {
      const { user_id, group_id, seat_number } = rows[0];
      
      if (status === "approved") {
        // Remove the seat from slots
        await db(`DELETE FROM slots WHERE group_id=$1 AND seat_no=$2 AND user_id=$3`, [group_id, seat_number, user_id]);
      }
      
      // Notify user
      const { rows: userInfo } = await db(`SELECT first_name FROM users WHERE id=$1`, [user_id]);
      const { rows: groupInfo } = await db(`SELECT name FROM groups WHERE id=$1`, [group_id]);
      const msg = status === "approved" 
        ? `Your request to remove Seat #${seat_number} from ${groupInfo[0]?.name} has been APPROVED. Your seat has been removed.`
        : `Your request to remove Seat #${seat_number} from ${groupInfo[0]?.name} has been REJECTED. ${response || ""}`;
      
      await addNotification(user_id, msg);
    }
    
    res.json({ success: true, message: `Request ${status}` });
  } catch (err) {
    console.error("Update removal request error:", err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`🚀 Rejoice Ajo API running on port ${PORT}`));
