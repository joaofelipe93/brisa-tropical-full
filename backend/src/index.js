import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// ✅ Validação de variáveis obrigatórias — servidor não sobe sem elas
const REQUIRED_ENV = ["PIX_KEY", "PIX_NAME", "WHATSAPP_NUMBER"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("\n❌ ERRO: Variáveis de ambiente obrigatórias não definidas:");
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error(
    "\nDefina essas variáveis no arquivo .env ou no painel do Railway.\n",
  );
  process.exit(1);
}

import { initDatabase } from "./db/database.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", productsRouter);
app.use("/api/orders", ordersRouter);

app.get("/api/whatsapp/status", (req, res) => {
  res.json({ isReady: true, mode: "wa.me" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

initDatabase();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🌴 Brisa Tropical Açaí — Backend rodando`);
  console.log(`📡 http://localhost:${PORT}/api\n`);
});
