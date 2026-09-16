import { prisma } from "../prisma";
import type { NotificationType } from "@prisma/client";

// Session 6: originally two citizen-facing events only. Priority-B's
// admin manual reassignment (routes/admin.ts) added a third call site
// that notifies a *partner* userId — see PROJECT_STATUS.md §7 for the
// call made when that was agreed. Still just three trigger points total;
// don't add more without the same kind of explicit check-in.
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
