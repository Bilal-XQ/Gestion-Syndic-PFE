import { eq, and, isNull, sql, gte, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  meetings,
  meetingInvitations,
  owners,
  users,
} from "@/lib/db/schema";

// ─── Aggregate helpers ────────────────────────────────────────────────
const totalInvitations = sql<number>`COUNT(${meetingInvitations.id})`.as(
  "total_invitations"
);
const acceptedCount =
  sql<number>`COUNT(CASE WHEN ${meetingInvitations.status} = 'accepted' THEN 1 END)`.as(
    "accepted_count"
  );
const declinedCount =
  sql<number>`COUNT(CASE WHEN ${meetingInvitations.status} = 'declined' THEN 1 END)`.as(
    "declined_count"
  );

/**
 * All active meetings for a syndic with invitation counts.
 */
export async function getMeetings(syndicId: string) {
  return db
    .select({
      id: meetings.id,
      syndicId: meetings.syndicId,
      title: meetings.title,
      description: meetings.description,
      meetingDate: meetings.meetingDate,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      location: meetings.location,
      status: meetings.status,
      createdAt: meetings.createdAt,
      totalInvitations,
      acceptedCount,
      declinedCount,
    })
    .from(meetings)
    .leftJoin(
      meetingInvitations,
      eq(meetingInvitations.meetingId, meetings.id)
    )
    .where(and(eq(meetings.syndicId, syndicId), isNull(meetings.deletedAt)))
    .groupBy(meetings.id)
    .orderBy(desc(meetings.meetingDate));
}

/**
 * Single meeting by ID with aggregate invitation counts.
 */
export async function getMeetingById(id: string) {
  const [meeting] = await db
    .select({
      id: meetings.id,
      syndicId: meetings.syndicId,
      title: meetings.title,
      description: meetings.description,
      meetingDate: meetings.meetingDate,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      location: meetings.location,
      status: meetings.status,
      createdAt: meetings.createdAt,
      totalInvitations,
      acceptedCount,
      declinedCount,
    })
    .from(meetings)
    .leftJoin(
      meetingInvitations,
      eq(meetingInvitations.meetingId, meetings.id)
    )
    .where(and(eq(meetings.id, id), isNull(meetings.deletedAt)))
    .groupBy(meetings.id);

  if (!meeting) return null;

  // Fetch invitations with owner details
  const invitations = await db
    .select({
      id: meetingInvitations.id,
      ownerId: meetingInvitations.ownerId,
      status: meetingInvitations.status,
      respondedAt: meetingInvitations.respondedAt,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
    })
    .from(meetingInvitations)
    .innerJoin(owners, eq(meetingInvitations.ownerId, owners.id))
    .innerJoin(users, eq(owners.userId, users.id))
    .where(eq(meetingInvitations.meetingId, id));

  return { meeting, invitations };
}

/**
 * Meetings the owner is invited to, with their invitation status.
 */
export async function getMeetingsForOwner(ownerId: string) {
  return db
    .select({
      id: meetings.id,
      title: meetings.title,
      description: meetings.description,
      meetingDate: meetings.meetingDate,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      location: meetings.location,
      status: meetings.status,
      createdAt: meetings.createdAt,
      invitationId: meetingInvitations.id,
      invitationStatus: meetingInvitations.status,
      respondedAt: meetingInvitations.respondedAt,
    })
    .from(meetings)
    .innerJoin(
      meetingInvitations,
      eq(meetingInvitations.meetingId, meetings.id)
    )
    .where(
      and(
        eq(meetingInvitations.ownerId, ownerId),
        isNull(meetings.deletedAt)
      )
    )
    .orderBy(desc(meetings.meetingDate));
}

/**
 * Upcoming scheduled meetings for the dashboard overview.
 */
export async function getUpcomingMeetings(
  syndicId: string,
  limit: number = 5
) {
  return db
    .select({
      id: meetings.id,
      title: meetings.title,
      meetingDate: meetings.meetingDate,
      startTime: meetings.startTime,
      endTime: meetings.endTime,
      location: meetings.location,
      totalInvitations,
      acceptedCount,
    })
    .from(meetings)
    .leftJoin(
      meetingInvitations,
      eq(meetingInvitations.meetingId, meetings.id)
    )
    .where(
      and(
        eq(meetings.syndicId, syndicId),
        eq(meetings.status, "scheduled"),
        gte(meetings.meetingDate, sql`CURRENT_DATE`),
        isNull(meetings.deletedAt)
      )
    )
    .groupBy(meetings.id)
    .orderBy(asc(meetings.meetingDate))
    .limit(limit);
}
