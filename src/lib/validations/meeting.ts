import { z } from "zod";

export const meetingSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis"),
    description: z.string().optional(),
    meetingDate: z.string().min(1, "La date est requise"),
    startTime: z.string().min(1, "L'heure de début est requise"),
    endTime: z.string().min(1, "L'heure de fin est requise"),
    location: z.string().min(1, "Le lieu est requis"),
    ownerIds: z
      .array(z.string().uuid("Propriétaire invalide"))
      .min(1, "Sélectionnez au moins un propriétaire"),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

export type MeetingFormValues = z.infer<typeof meetingSchema>;

export const respondInvitationSchema = z.object({
  invitationId: z.string().uuid("Invitation invalide"),
  response: z.enum(["accepted", "declined"], {
    message: "Réponse invalide",
  }),
});

export type RespondInvitationValues = z.infer<typeof respondInvitationSchema>;
