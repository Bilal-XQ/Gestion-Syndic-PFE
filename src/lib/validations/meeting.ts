import { z } from "zod";

export function createMeetingSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, t("meeting.titleRequired")),
      description: z.string().optional(),
      meetingDate: z.string().min(1, t("meeting.dateRequired")),
      startTime: z.string().min(1, t("meeting.startTimeRequired")),
      endTime: z.string().min(1, t("meeting.endTimeRequired")),
      location: z.string().min(1, t("meeting.locationRequired")),
      ownerIds: z
        .array(z.string().uuid(t("meeting.ownerInvalid")))
        .min(1, t("meeting.selectAtLeastOneOwner")),
    })
    .refine((data) => data.endTime > data.startTime, {
      message: t("meeting.endTimeAfterStart"),
      path: ["endTime"],
    });
}

export type MeetingFormValues = z.infer<ReturnType<typeof createMeetingSchema>>;

export function createRespondInvitationSchema(t: (key: string) => string) {
  return z.object({
    invitationId: z.string().uuid(t("meeting.invitationInvalid")),
    response: z.enum(["accepted", "declined"], {
      message: t("meeting.responseInvalid"),
    }),
  });
}

export type RespondInvitationValues = z.infer<ReturnType<typeof createRespondInvitationSchema>>;
