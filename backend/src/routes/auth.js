// src/routes/auth.js
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "brisa-tropical-secret";
// POST /api/auth/login
router.post("/login", (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD;

  if (!password) return res.status(400).json({ error: "Senha obrigatória" });
  if (password !== ADMIN_PASS)
    return res.status(401).json({ error: "Senha incorreta" });

  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, expiresIn: "8h" });
});

// GET /api/auth/verify
router.get("/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
