import { prisma } from "../prisma";
import type { NotificationType } from "@prisma/client";

// Session 6: two events only, per PROJECT_REFERENCE.md §2/§5 — do not add
// more trigger points than the two call sites that use this
// (POST /challenges on auto-assignment, PATCH /challenges/:id/status).
// Notifications are citizen-facing only for this MVP (see PROJECT_STATUS.md
// §6's Session 6 spec: "Citizen sees their own notifications") — never
// called for a partner or admin userId.
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  return prisma.notification.create({
    data: { userId, type, title, message },
  });
}
