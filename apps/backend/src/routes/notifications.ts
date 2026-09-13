import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /notifications — §8: returns the caller's own notifications. Session
// 6's spec (PROJECT_STATUS.md §6) only calls for citizens to see these, but
// there's no reason to restrict the role here: the query is already scoped
// to req.user!.id, so a partner or admin account hitting this just gets
// their own (empty, for now, since nothing notifies them yet) list — same
// pattern as not over-restricting a route that's already ownership-safe.
router.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(notifications);
});

// PATCH /notifications/:id/read — §8. Ownership-checked: a user may only
// mark their own notification read (same ownership pattern as Session 5's
// challenge PATCH routes).
router.patch("/:id/read", requireAuth, async (req, res) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });
  if (!notification) {
    return sendError(res, 404, "NOTIFICATION_NOT_FOUND", "No notification with that id.");
  }
  if (notification.userId !== req.user!.id) {
    return sendError(res, 403, "FORBIDDEN", "This notification isn't yours.");
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true },
  });
  res.json(updated);
});

export default router;
