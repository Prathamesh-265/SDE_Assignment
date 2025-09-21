const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dbFile = path.join(__dirname, "contacts.db");
const db = new sqlite3.Database(dbFile);

db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const isEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isPhone = (phone) => /^\d{10}$/.test(phone);

// Add contact
app.post("/contacts", (req, res) => {
  const { name, email, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });
  if (!isEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!isPhone(phone)) return res.status(400).json({ error: "Phone must be 10 digits" });

  const stmt = db.prepare("INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)");
  stmt.run(name.trim(), email.trim(), phone.trim(), function (err) {
    if (err) return res.status(500).json({ error: "Insert failed" });
    db.get("SELECT * FROM contacts WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: "Fetch failed" });
      res.status(201).json(row);
    });
  });
  stmt.finalize();
});

// List contacts (pagination)
app.get("/contacts", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(20, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  db.get("SELECT COUNT(*) as total FROM contacts", (err, countRow) => {
    if (err) return res.status(500).json({ error: "Count failed" });

    db.all(
      "SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ error: "Fetch failed" });
        res.json({ page, limit, total: countRow.total, contacts: rows });
      }
    );
  });
});

// Delete contact
app.delete("/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  db.run("DELETE FROM contacts WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    if (this.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
