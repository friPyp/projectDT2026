import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./prisma";
import authRouter from "./routes/auth";
import challengesRouter from "./routes/challenges";
import notificationsRouter from "./routes/notifications";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);

// POST (create, citizen-only, auto-categorizes + auto-routes per
// Session 4) + GET (own list for CITIZEN, assigned list for PARTNER) +
// PATCH /:id/team + PATCH /:id/status (both PARTNER-only, Session 5).
// Both PATCH /status and auto-assignment on POST also fire notifications
// (Session 6, see routes/notifications.ts + lib/notify.ts).
app.use("/api/v1/challenges", challengesRouter);

// GET / (own notifications) + PATCH /:id/read — Session 6. Admin route is
// still Session 7 — do not add it here yet.
app.use("/api/v1/notifications", notificationsRouter);

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
