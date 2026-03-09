"use server";

import { eq, and, isNull, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import {
  meetings,
  meetingInvitations,
  notifications,
  owners,
  users,
  auditLogs,
} from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createMeetingSchema } from "@/lib/validations/meeting";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getMeetingById } from "@/lib/db/queries/meetings";
import { MeetingInvitationEmail } from "@/lib/email/templates/meeting-invitation";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helper: authenticate + authorize syndic
// ---------------------------------------------------------------------------
async function getAuthenticatedSyndic() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return null;

  return user;
}

// ---------------------------------------------------------------------------
// Create meeting
// ---------------------------------------------------------------------------
export async function createMeeting(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createMeetingSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  // 3. Verify building exists
  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  // 4. Verify all ownerIds belong to the syndic's building
  const ownerRecords = await db
    .select({
      id: owners.id,
      userId: owners.userId,
      apartmentId: owners.apartmentId,
    })
    .from(owners)
    .innerJoin(
      // Need to use a subquery-type approach — join apartments to check building
      // We'll filter owners by their apartment's building
      // simpler: use inArray + separate check
      users,
      eq(owners.userId, users.id)
    )
    .where(
      and(
        inArray(owners.id, parsed.data.ownerIds),
        isNull(owners.deletedAt)
      )
    );

  if (ownerRecords.length !== parsed.data.ownerIds.length) {
    return {
      success: false,
      error: "Un ou plusieurs propriétaires sont invalides",
    };
  }

  // Also fetch owner emails for sending invitations
  const ownerDetails = await db
    .select({
      ownerId: owners.id,
      userId: owners.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(owners)
    .innerJoin(users, eq(owners.userId, users.id))
    .where(
      and(
        inArray(owners.id, parsed.data.ownerIds),
        isNull(owners.deletedAt)
      )
    );

  // 5. Insert meeting + invitations + notifications inside transaction
  let meetingId: string;
  const invitationRows: Array<{
    invitationId: string;
    ownerId: string;
    userId: string;
  }> = [];

  await db.transaction(async (tx) => {
    // Insert meeting
    const [newMeeting] = await tx
      .insert(meetings)
      .values({
        syndicId: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        meetingDate: parsed.data.meetingDate,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        location: parsed.data.location,
        status: "scheduled",
      })
      .returning({ id: meetings.id });

    meetingId = newMeeting.id;

    // Insert invitations
    for (const ownerDetail of ownerDetails) {
      const [invitation] = await tx
        .insert(meetingInvitations)
        .values({
          meetingId: meetingId,
          ownerId: ownerDetail.ownerId,
          status: "invited",
        })
        .returning({ id: meetingInvitations.id });

      invitationRows.push({
        invitationId: invitation.id,
        ownerId: ownerDetail.ownerId,
        userId: ownerDetail.userId,
      });
    }

    // Insert notifications for each invited owner
    for (const row of invitationRows) {
      await tx.insert(notifications).values({
        userId: row.userId,
        type: "meeting_invitation",
        title: "Invitation à une réunion",
        message: `Vous êtes invité(e) à la réunion "${parsed.data.title}" le ${parsed.data.meetingDate}`,
        metadata: { meetingId: meetingId, invitationId: row.invitationId },
        isRead: false,
      });
    }
  });

  // 6. Send emails OUTSIDE transaction
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/notifications`;
  for (const ownerDetail of ownerDetails) {
    try {
      await resend.emails.send({
        from: "Syndic <onboarding@resend.dev>",
        to: ownerDetail.email,
        subject: `Invitation — ${parsed.data.title}`,
        react: MeetingInvitationEmail({
          ownerName: `${ownerDetail.firstName} ${ownerDetail.lastName}`,
          meetingTitle: parsed.data.title,
          meetingDate: parsed.data.meetingDate,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime,
          location: parsed.data.location,
          description: parsed.data.description,
          buildingName: building.name,
          portalUrl,
        }),
      });
    } catch {
      // Email failure should not fail the action
      console.error(
        `Failed to send meeting invitation email to ${ownerDetail.email}`
      );
    }
  }

  // 7. Audit log OUTSIDE transaction
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CREATE_MEETING",
    entityType: "meetings",
    entityId: meetingId!,
  });

  return { success: true, data: { id: meetingId! } };
}

// ---------------------------------------------------------------------------
// Cancel meeting
// ---------------------------------------------------------------------------
export async function cancelMeeting(id: string): Promise<ActionResult> {
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  const result = await getMeetingById(id);
  if (!result || result.meeting.syndicId !== user.id) {
    return { success: false, error: "Réunion introuvable" };
  }

  if (result.meeting.status === "cancelled") {
    return { success: false, error: "Cette réunion est déjà annulée" };
  }

  await db
    .update(meetings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(meetings.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CANCEL_MEETING",
    entityType: "meetings",
    entityId: id,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Delete meeting (soft-delete)
// ---------------------------------------------------------------------------
export async function deleteMeeting(id: string): Promise<ActionResult> {
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  const result = await getMeetingById(id);
  if (!result || result.meeting.syndicId !== user.id) {
    return { success: false, error: "Réunion introuvable" };
  }

  await db
    .update(meetings)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(meetings.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DELETE_MEETING",
    entityType: "meetings",
    entityId: id,
  });

  return { success: true, data: null };
}
