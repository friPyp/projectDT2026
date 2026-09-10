import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import authRouter from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());

// Session 2 scope: auth only (register/login/logout, JWT, role
// enforcement middleware). Challenges/notifications/admin routes are
// later sessions per PROJECT_REFERENCE.md §5 — do not add them here yet.
app.use("/api/v1/auth", authRouter);

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ success: false, db: "unreachable" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
