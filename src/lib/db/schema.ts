import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

// ─── users ────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // matches auth.users.id
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    role: text("role").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    roleIdx: index("users_role_idx").on(table.role),
    deletedAtIdx: index("users_deleted_at_idx").on(table.deletedAt),
    roleCheck: check(
      "users_role_check",
      sql`${table.role} IN ('syndic', 'proprietaire')`
    ),
  })
);

// ─── buildings ────────────────────────────────────────────────────────
export const buildings = pgTable(
  "buildings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syndicId: uuid("syndic_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    address: text("address").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    syndicIdIdx: index("buildings_syndic_id_idx").on(table.syndicId),
  })
);

// ─── apartments ───────────────────────────────────────────────────────
export const apartments = pgTable(
  "apartments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id),
    unitNumber: text("unit_number").notNull(),
    floor: integer("floor").notNull(),
    surfaceArea: numeric("surface_area").notNull(),
    roomCount: integer("room_count").notNull(),
    type: text("type")
      .notNull()
      .default("t2")
      .$type<"studio" | "t1" | "t2" | "t3" | "t4_plus">(),
    status: text("status").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    buildingIdIdx: index("apartments_building_id_idx").on(table.buildingId),
    typeIdx: index("apartments_type_idx").on(table.type),
    statusIdx: index("apartments_status_idx").on(table.status),
    deletedAtIdx: index("apartments_deleted_at_idx").on(table.deletedAt),
    typeCheck: check(
      "apartments_type_check",
      sql`${table.type} IN ('studio', 't1', 't2', 't3', 't4_plus')`
    ),
    statusCheck: check(
      "apartments_status_check",
      sql`${table.status} IN ('occupied', 'vacant')`
    ),
  })
);

// ─── owners ───────────────────────────────────────────────────────────
export const owners = pgTable(
  "owners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    apartmentId: uuid("apartment_id")
      .notNull()
      .references(() => apartments.id),
    ownershipDate: date("ownership_date").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("owners_user_id_idx").on(table.userId),
    apartmentIdIdx: index("owners_apartment_id_idx").on(table.apartmentId),
    deletedAtIdx: index("owners_deleted_at_idx").on(table.deletedAt),
  })
);

// ─── charges ──────────────────────────────────────────────────────────
// NOTE: amount_paid, remaining_amount, status are NEVER stored.
// They are computed at query time via SQL aggregation over payments.
export const charges = pgTable(
  "charges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syndicId: uuid("syndic_id")
      .notNull()
      .references(() => users.id),
    apartmentId: uuid("apartment_id")
      .notNull()
      .references(() => apartments.id),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    totalAmount: numeric("total_amount").notNull(),
    dueDate: date("due_date").notNull(),
    lastReminderSentAt: timestamp("last_reminder_sent_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    apartmentIdIdx: index("charges_apartment_id_idx").on(table.apartmentId),
    syndicIdIdx: index("charges_syndic_id_idx").on(table.syndicId),
    dueDateIdx: index("charges_due_date_idx").on(table.dueDate),
    deletedAtIdx: index("charges_deleted_at_idx").on(table.deletedAt),
    categoryCheck: check(
      "charges_category_check",
      sql`${table.category} IN ('electricity', 'water', 'maintenance', 'repair', 'other')`
    ),
  })
);

// ─── payments ─────────────────────────────────────────────────────────
// Immutable — rows are never updated or deleted.
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chargeId: uuid("charge_id")
      .notNull()
      .references(() => charges.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id),
    amount: numeric("amount").notNull(),
    paymentDate: date("payment_date").notNull(),
    method: text("method").notNull(),
    reference: text("reference").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    chargeIdIdx: index("payments_charge_id_idx").on(table.chargeId),
    ownerIdIdx: index("payments_owner_id_idx").on(table.ownerId),
    paymentDateIdx: index("payments_payment_date_idx").on(table.paymentDate),
    methodCheck: check(
      "payments_method_check",
      sql`${table.method} IN ('bank_transfer', 'check', 'cash')`
    ),
  })
);

// ─── meetings ─────────────────────────────────────────────────────────
export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syndicId: uuid("syndic_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    meetingDate: date("meeting_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    location: text("location").notNull(),
    status: text("status").notNull().default("scheduled"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    syndicIdIdx: index("meetings_syndic_id_idx").on(table.syndicId),
    statusCheck: check(
      "meetings_status_check",
      sql`${table.status} IN ('scheduled', 'completed', 'cancelled')`
    ),
  })
);

// ─── meeting_invitations ──────────────────────────────────────────────
export const meetingInvitations = pgTable(
  "meeting_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id),
    status: text("status").notNull().default("invited"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    meetingIdIdx: index("meeting_invitations_meeting_id_idx").on(
      table.meetingId
    ),
    ownerIdIdx: index("meeting_invitations_owner_id_idx").on(table.ownerId),
    statusCheck: check(
      "meeting_invitations_status_check",
      sql`${table.status} IN ('invited', 'accepted', 'declined')`
    ),
  })
);

// ─── notifications ────────────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    typeCheck: check(
      "notifications_type_check",
      sql`${table.type} IN ('meeting_invitation', 'payment_reminder', 'payment_confirmation', 'payment_notice')`
    ),
  })
);

// ─── audit_logs ───────────────────────────────────────────────────────
// Immutable — rows are NEVER updated or deleted.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    entityIdIdx: index("audit_logs_entity_id_idx").on(table.entityId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
  })
);

// ─── Relations ────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  buildings: many(buildings),
  owners: many(owners),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  syndic: one(users, {
    fields: [buildings.syndicId],
    references: [users.id],
  }),
  apartments: many(apartments),
}));

export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  building: one(buildings, {
    fields: [apartments.buildingId],
    references: [buildings.id],
  }),
  owners: many(owners),
  charges: many(charges),
}));

export const ownersRelations = relations(owners, ({ one, many }) => ({
  user: one(users, {
    fields: [owners.userId],
    references: [users.id],
  }),
  apartment: one(apartments, {
    fields: [owners.apartmentId],
    references: [apartments.id],
  }),
  payments: many(payments),
  meetingInvitations: many(meetingInvitations),
}));

export const chargesRelations = relations(charges, ({ one, many }) => ({
  syndic: one(users, {
    fields: [charges.syndicId],
    references: [users.id],
  }),
  apartment: one(apartments, {
    fields: [charges.apartmentId],
    references: [apartments.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  charge: one(charges, {
    fields: [payments.chargeId],
    references: [charges.id],
  }),
  owner: one(owners, {
    fields: [payments.ownerId],
    references: [owners.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  syndic: one(users, {
    fields: [meetings.syndicId],
    references: [users.id],
  }),
  invitations: many(meetingInvitations),
}));

export const meetingInvitationsRelations = relations(
  meetingInvitations,
  ({ one }) => ({
    meeting: one(meetings, {
      fields: [meetingInvitations.meetingId],
      references: [meetings.id],
    }),
    owner: one(owners, {
      fields: [meetingInvitations.ownerId],
      references: [owners.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
