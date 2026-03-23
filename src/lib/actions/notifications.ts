"use server";

import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { meetingInvitations, owners, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createRespondInvitationSchema } from "@/lib/validations/meeting";
import {
  markAsRead,
  markAllAsRead,
} from "@/lib/db/queries/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Respond to invitation (proprietaire only)
// ---------------------------------------------------------------------------
export async function respondToInvitation(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const schema = createRespondInvitationSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: tc("errors.unauthenticated") };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "proprietaire") {
    return { success: false, error: tc("errors.forbidden") };
  }

  // 3. Find the owner record for this user
  const [ownerRecord] = await db
    .select({ id: owners.id })
    .from(owners)
    .where(and(eq(owners.userId, user.id), isNull(owners.deletedAt)));

  if (!ownerRecord) {
    return { success: false, error: tc("errors.ownerNotFound") };
  }

  // 4. Load invitation and verify ownership + status
  const [invitation] = await db
    .select()
    .from(meetingInvitations)
    .where(eq(meetingInvitations.id, parsed.data.invitationId));

  if (!invitation) {
    return { success: false, error: tc("errors.invitationNotFound") };
  }

  if (invitation.ownerId !== ownerRecord.id) {
    return { success: false, error: tc("errors.forbidden") };
  }

  if (invitation.status !== "invited") {
    return { success: false, error: tc("errors.alreadyResponded") };
  }

  // 5. Update invitation status
  await db
    .update(meetingInvitations)
    .set({
      status: parsed.data.response,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(meetingInvitations.id, parsed.data.invitationId));

  // 6. Audit log — NO notification/email for accept/decline
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "RESPOND_INVITATION",
    entityType: "meeting_invitations",
    entityId: parsed.data.invitationId,
    metadata: { response: parsed.data.response },
  });

  return { success: true, data: { id: parsed.data.invitationId } };
}

// ---------------------------------------------------------------------------
// Mark notification as read
// ---------------------------------------------------------------------------
export async function markNotificationRead(
  id: string
): Promise<ActionResult> {
  const tc = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { success: false, error: tc("errors.unauthenticated") };

  await markAsRead(id, user.id);

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Mark all notifications as read
// ---------------------------------------------------------------------------
export async function markAllNotificationsRead(): Promise<ActionResult> {
  const tc = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { success: false, error: tc("errors.unauthenticated") };

  await markAllAsRead(user.id);

  return { success: true, data: null };
}
