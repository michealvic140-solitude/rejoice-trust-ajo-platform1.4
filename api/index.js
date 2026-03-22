import express from "express";
import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const pg = require("pg");
const bcrypt = require("bcrypt");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Database Pool
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

// File uploads
const uploadDir = path.join(__dirname, "../.vercel/output/static/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

// Session handling without session store (stateless for serverless)
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      // For now, simple token validation. In production, use proper JWT
      req.session = { 
        userId: req.body?.userId || null,
        role: req.body?.role || "user",
        username: req.body?.username || null
      };
    } catch (e) {
      req.session = {};
    }
  } else {
    req.session = {};
  }
  next();
});

// Helpers
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

// ─── Initialize admin password on first request ──────────────────────────────
let adminInitialized = false;
app.use(async (req, res, next) => {
  if (!adminInitialized) {
    try {
      const hash = await bcrypt.hash("Goodynessy1", 10);
      await db(`UPDATE users SET password_hash = $1 WHERE username = 'michaelvictor0014'`, [hash]);
      adminInitialized = true;
    } catch (e) {
      console.error("Admin init error:", e.message);
    }
  }
  next();
});

// ═════════════════════════════ AUTH ROUTES ════════════════════════════════════

// GET /api/auth/me
app.get("/api/auth/me", async (req, res) => {
  if (!req.session?.userId) return res.json({ user: null });
  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
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
    
    // Maintenance mode check
    const { rows: mRows } = await db(`SELECT value FROM platform_settings WHERE key='maintenance_mode'`);
    if (user.role === "user" && mRows[0]?.value === 'true') {
      return res.status(503).json({ error: "MAINTENANCE_MODE", message: "The platform is under maintenance. Please try again later." });
    }
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    
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
      },
      token: `user_${user.id}_${Date.now()}`
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
    
    const existing = await db(`SELECT id FROM users WHERE username = $1 OR email = $2`, [username, email]);
    if (existing.rows.length) return res.status(400).json({ error: "Username or email already taken" });
    
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db(
      `INSERT INTO users (username, email, password_hash, first_name, middle_name, last_name, phone, dob, age, state_of_origin, lga, current_state, current_address, home_address, bvn_nin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [username, email, hash, firstName, middleName || null, lastName, phone || null,
       dob || null, age ? parseInt(age) : null, stateOfOrigin || null, lga || null,
       currentState || null, currentAddress || null, homeAddress || null, bvnNin || null]
    );
    const user = rows[0];
    await addNotification(user.id, `Welcome to Rejoice Ajo, ${firstName}! Your account has been created successfully.`);
    
    res.json({
      user: {
        id: user.id, username: user.username, firstName: user.first_name, middleName: user.middle_name,
        lastName: user.last_name, email: user.email, phone: user.phone, role: user.role,
        isVip: false, isRestricted: false, isBanned: false, isFrozen: false,
        totalPaid: 0, unreadNotifications: 1, activeSlots: 0,
      },
      token: `user_${user.id}_${Date.now()}`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

// ═════════════════════════════ USER ROUTES ════════════════════════════════════

// GET /api/users/profile
app.get("/api/users/profile", authRequired, async (req, res) => {
  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/profile
app.patch("/api/users/profile", authRequired, async (req, res) => {
  try {
    const { firstName, middleName, lastName, phone, nickname, stateOfOrigin, lga, currentState, currentAddress, homeAddress, dob, age } = req.body;
    await db(
      `UPDATE users SET first_name=$1, middle_name=$2, last_name=$3, phone=$4, nickname=$5, state_of_origin=$6, lga=$7, current_state=$8, current_address=$9, home_address=$10, dob=$11, age=$12 WHERE id=$13`,
      [firstName, middleName||null, lastName, phone||null, nickname||null, stateOfOrigin||null, lga||null, currentState||null, currentAddress||null, homeAddress||null, dob||null, age||null, req.session.userId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/password
app.patch("/api/users/password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await db(`SELECT password_hash FROM users WHERE id = $1`, [req.session.userId]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: "Current password is incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    await db(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, req.session.userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/email
app.patch("/api/users/email", authRequired, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const { rows } = await db(`SELECT password_hash FROM users WHERE id = $1`, [req.session.userId]);
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: "Password is incorrect" });
    const exists = await db(`SELECT id FROM users WHERE email = $1`, [newEmail]);
    if (exists.rows.length) return res.status(400).json({ error: "Email already in use" });
    await db(`UPDATE users SET email = $1 WHERE id = $2`, [newEmail, req.session.userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/users/bank
app.patch("/api/users/bank", authRequired, async (req, res) => {
  try {
    const { accountName, accountNumber, bankName } = req.body;
    await db(`UPDATE users SET bank_acc_name=$1, bank_acc_num=$2, bank_name=$3 WHERE id=$4`,
      [accountName, accountNumber, bankName, req.session.userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/notifications
app.get("/api/users/notifications", authRequired, async (req, res) => {
  try {
    const { rows } = await db(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.session.userId]);
    res.json(rows.map(n => ({ id: n.id, userId: n.user_id, message: n.message, read: n.read, createdAt: n.created_at })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/notifications/read
app.post("/api/users/notifications/read", authRequired, async (req, res) => {
  try {
    await db(`UPDATE notifications SET read = true WHERE user_id = $1`, [req.session.userId]);
    await db(`UPDATE users SET unread_notifications = 0 WHERE id = $1`, [req.session.userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/transactions
app.get("/api/users/transactions", authRequired, async (req, res) => {
  try {
    const { rows } = await db(
      `SELECT p.*, g.name as group_name FROM payments p LEFT JOIN groups g ON p.group_id = g.id WHERE p.user_id = $1 ORDER BY p.created_at DESC`,
      [req.session.userId]
    );
    res.json(rows.map(t => ({
      id: t.id, code: t.code, groupName: t.group_name || t.group_name, userId: t.user_id,
      amount: Number(t.amount), status: t.status, date: t.date, screenshotUrl: t.screenshot_url,
      seatNo: t.seat_no, groupId: t.group_id,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/leaderboard
app.get("/api/users/leaderboard", async (req, res) => {
  try {
    const { rows } = await db(`SELECT id, username, first_name, last_name, total_paid, is_vip FROM users WHERE NOT is_banned ORDER BY total_paid DESC LIMIT 10`);
    res.json(rows.map(u => ({ id: u.id, username: u.username, firstName: u.first_name, lastName: u.last_name, totalPaid: Number(u.total_paid), isVip: u.is_vip })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ═════════════════════════════ GROUP ROUTES ════════════════════════════════════

// GET /api/groups
app.get("/api/groups", async (req, res) => {
  try {
    const { rows } = await db(`SELECT * FROM groups ORDER BY created_at ASC`);
    res.json(rows.map(g => ({
      id: g.id, name: g.name, description: g.description,
      contributionAmount: Number(g.contribution_amount), cycleType: g.cycle_type,
      totalSlots: g.total_slots, filledSlots: g.filled_slots,
      isLive: g.is_live, isLocked: g.is_locked, chatLocked: g.chat_locked,
      bankName: g.bank_name, accountNumber: g.account_number, accountName: g.account_name,
      termsText: g.terms_text, createdAt: g.created_at,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id
app.get("/api/groups/:id", async (req, res) => {
  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id/slots
app.get("/api/groups/:id/slots", async (req, res) => {
  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id/members
app.get("/api/groups/:id/members", async (req, res) => {
  try {
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/:id/join
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
    await addNotification(userId, `Dear ${user[0].first_name}, you have successfully joined seat #${seatNo} in ${group[0].name}.`);
    res.json({ success: true, message: `Successfully joined seat #${seatNo}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/:id/exit
app.post("/api/groups/:id/exit", authRequired, async (req, res) => {
  try {
    const { reason } = req.body;
    const { rows: user } = await db(`SELECT * FROM users WHERE id = $1`, [req.session.userId]);
    const { rows: group } = await db(`SELECT name FROM groups WHERE id = $1`, [req.params.id]);
    await db(`INSERT INTO exit_requests (user_id, username, group_id, reason) VALUES ($1, $2, $3, $4)`,
      [req.session.userId, user[0]?.username, req.params.id, reason || "Personal reasons"]);
    await addNotification(req.session.userId, `Your exit request from ${group[0]?.name} has been submitted.`);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/:id/payment
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
    const { rows: user } = await db(`SELECT first_name FROM users WHERE id = $1`, [userId]);
    await addNotification(userId, `Dear ${user[0].first_name}, your payment ${code} has been submitted and is pending approval.`);
    res.json({ success: true, code, payment: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/groups/:id/chat
app.get("/api/groups/:id/chat", authRequired, async (req, res) => {
  try {
    const { rows } = await db(
      `SELECT * FROM chat_messages WHERE group_id = $1 ORDER BY created_at ASC LIMIT 100`,
      [req.params.id]
    );
    res.json(rows.map(m => ({ id: m.id, username: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/groups/:id/chat
app.post("/api/groups/:id/chat", authRequired, async (req, res) => {
  try {
    const { text } = req.body;
    const { rows: group } = await db(`SELECT chat_locked FROM groups WHERE id = $1`, [req.params.id]);
    if (group[0]?.chat_locked && req.session.role !== "admin") return res.status(403).json({ error: "Chat is locked" });
    const { rows } = await db(
      `INSERT INTO chat_messages (group_id, user_id, username, text) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.session.userId, req.session.username, text]
    );
    const m = rows[0];
    res.json({ id: m.id, username: m.username, text: m.text, time: new Date(m.created_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ═════════════════════════════ ANNOUNCEMENT ROUTES ════════════════════════════

// GET /api/announcements
app.get("/api/announcements", async (req, res) => {
  try {
    const { rows } = await db(`SELECT * FROM announcements ORDER BY created_at DESC`);
    res.json(rows.map(a => ({
      id: a.id, title: a.title, body: a.body, type: a.type,
      imageUrl: a.image_url, targetGroupId: a.target_group_id,
      adminName: a.admin_name, createdAt: a.created_at,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/announcements
app.post("/api/announcements", adminOrModRequired, upload.single("image"), async (req, res) => {
  try {
    const { title, body, type, targetGroupId } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || null;
    const { rows } = await db(
      `INSERT INTO announcements (title, body, type, image_url, target_group_id, admin_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, body, type || "announcement", imageUrl, targetGroupId || null, req.session.username]
    );
    const a = rows[0];
    res.json({ id: a.id, title: a.title, body: a.body, type: a.type, imageUrl: a.image_url, targetGroupId: a.target_group_id, adminName: a.admin_name, createdAt: a.created_at });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/announcements/:id
app.delete("/api/announcements/:id", adminOrModRequired, async (req, res) => {
  try {
    await db(`DELETE FROM announcements WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ═════════════════════════════ SUPPORT TICKET ROUTES ══════════════════════════

// GET /api/support
app.get("/api/support", authRequired, async (req, res) => {
  try {
    const isAdminOrMod = req.session.role === "admin" || req.session.role === "moderator";
    const { rows } = isAdminOrMod
      ? await db(`SELECT * FROM support_tickets ORDER BY created_at DESC`)
      : await db(`SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`, [req.session.userId]);
    res.json(rows.map(t => ({
      id: t.id, userId: t.user_id, username: t.username, subject: t.subject,
      message: t.message, status: t.status, adminReply: t.admin_reply,
      repliedAt: t.replied_at, createdAt: t.created_at,
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/support
app.post("/api/support", authRequired, async (req, res) => {
  try {
    const { subject, message } = req.body;
    const { rows: user } = await db(`SELECT username FROM users WHERE id = $1`, [req.session.userId]);
    const { rows } = await db(
      `INSERT INTO support_tickets (user_id, username, subject, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.session.userId, user[0]?.username, subject, message]
    );
    res.json({ success: true, ticket: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/support/:id/reply
app.patch("/api/support/:id/reply", adminOrModRequired, async (req, res) => {
  try {
    const { reply } = req.body;
    const { rows } = await db(
      `UPDATE support_tickets SET admin_reply=$1, status='replied', replied_at=NOW() WHERE id=$2 RETURNING user_id, subject`,
      [reply, req.params.id]
    );
    if (rows[0]) {
      await addNotification(rows[0].user_id, `Your support ticket has received a reply from admin.`);
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/support/:id/close
app.patch("/api/support/:id/close", adminOrModRequired, async (req, res) => {
  try {
    await db(`UPDATE support_tickets SET status='closed' WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ═════════════════════════════ CONTACT INFO ════════════════════════════════════

// GET /api/contact
app.get("/api/contact", async (req, res) => {
  try {
    const { rows } = await db(`SELECT * FROM contact_info WHERE id = 1`);
    const c = rows[0] || {};
    res.json({ whatsapp: c.whatsapp, facebook: c.facebook, email: c.email, callNumber: c.call_number, smsNumber: c.sms_number });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/contact
app.put("/api/contact", adminRequired, async (req, res) => {
  try {
    const { whatsapp, facebook, email, callNumber, smsNumber } = req.body;
    await db(
      `INSERT INTO contact_info (id, whatsapp, facebook, email, call_number, sms_number) VALUES (1,$1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET whatsapp=$1, facebook=$2, email=$3, call_number=$4, sms_number=$5`,
      [whatsapp, facebook, email, callNumber, smsNumber]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ═════════════════════════════ HEALTH CHECK ════════════════════════════════════

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  pool.end(() => process.exit(0));
});

export default app;
