import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("pixelcraft.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    thumbnail TEXT,
    type TEXT DEFAULT 'avatar',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    creations_count INTEGER DEFAULT 0,
    challenges_entered INTEGER DEFAULT 0,
    badges_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    reward_type TEXT,
    reward_value TEXT,
    end_date DATETIME
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER,
    project_id INTEGER,
    user_id INTEGER DEFAULT 1,
    fire INTEGER DEFAULT 0,
    sparkle INTEGER DEFAULT 0,
    diamond INTEGER DEFAULT 0,
    crown INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO user_stats (id, xp, level) VALUES (1, 0, 1);
  
  -- Seed initial challenge if none exists
  INSERT OR IGNORE INTO challenges (id, title, description, reward_type, reward_value, end_date) 
  VALUES (1, 'Design Your Dream Sneaker', 'Create a pixel sneaker that represents your style.', 'palette', 'Street Mode', '2026-03-07');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/projects", (req, res) => {
    const { type } = req.query;
    let query = "SELECT * FROM projects";
    const params: any[] = [];
    if (type) {
      query += " WHERE type = ?";
      params.push(type);
    }
    query += " ORDER BY updated_at DESC";
    const projects = db.prepare(query).all(...params);
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { name, data, thumbnail, type, category } = req.body;
    const result = db.prepare("INSERT INTO projects (name, data, thumbnail, type, category) VALUES (?, ?, ?, ?, ?)").run(name, data, thumbnail, type || 'avatar', category);
    
    // Reward XP and update counts
    db.prepare("UPDATE user_stats SET xp = xp + 100, creations_count = creations_count + 1 WHERE id = 1").run();
    
    // Check for level up
    const stats = db.prepare("SELECT xp, level FROM user_stats WHERE id = 1").get();
    const newLevel = Math.floor(stats.xp / 1000) + 1;
    if (newLevel > stats.level) {
      db.prepare("UPDATE user_stats SET level = ?, badges_count = badges_count + 1 WHERE id = 1").run(newLevel);
    }
    
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/projects/:id", (req, res) => {
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM user_stats WHERE id = 1").get();
    res.json(stats);
  });

  app.get("/api/challenges", (req, res) => {
    const challenges = db.prepare("SELECT * FROM challenges ORDER BY end_date DESC").all();
    res.json(challenges);
  });

  app.get("/api/submissions", (req, res) => {
    const submissions = db.prepare(`
      SELECT s.*, p.thumbnail, p.name as project_name 
      FROM submissions s 
      JOIN projects p ON s.project_id = p.id
    `).all();
    res.json(submissions);
  });

  app.post("/api/submissions", (req, res) => {
    const { challenge_id, project_id } = req.body;
    const result = db.prepare("INSERT INTO submissions (challenge_id, project_id) VALUES (?, ?)").run(challenge_id, project_id);
    db.prepare("UPDATE user_stats SET challenges_entered = challenges_entered + 1 WHERE id = 1").run();
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/submissions/:id/react", (req, res) => {
    const { type } = req.body; // fire, sparkle, diamond, crown
    if (['fire', 'sparkle', 'diamond', 'crown'].includes(type)) {
      db.prepare(`UPDATE submissions SET ${type} = ${type} + 1 WHERE id = ?`).run(req.params.id);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
