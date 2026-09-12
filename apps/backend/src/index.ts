import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import authRouter from "./routes/auth";
import challengesRouter from "./routes/challenges";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);

// POST (create, citizen-only, now auto-categorizes + auto-routes per
// Session 4) + GET (citizen's own list, Session 3). No /:id, no PATCH
// team/status (PARTNER-only, Session 5). Notifications/admin routes are
// later sessions per PROJECT_REFERENCE.md §5 — do not add them here yet.
app.use("/api/v1/challenges", challengesRouter);

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
