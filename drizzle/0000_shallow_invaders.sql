CREATE TABLE "apartments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"unit_number" text NOT NULL,
	"floor" integer NOT NULL,
	"surface_area" numeric NOT NULL,
	"room_count" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apartments_status_check" CHECK ("apartments"."status" IN ('occupied', 'vacant'))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"syndic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"syndic_id" uuid NOT NULL,
	"apartment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"due_date" date NOT NULL,
	"last_reminder_sent_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "charges_category_check" CHECK ("charges"."category" IN ('electricity', 'water', 'maintenance', 'repair', 'other'))
);
--> statement-breakpoint
CREATE TABLE "meeting_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_invitations_status_check" CHECK ("meeting_invitations"."status" IN ('invited', 'accepted', 'declined'))
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"syndic_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"meeting_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meetings_status_check" CHECK ("meetings"."status" IN ('scheduled', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_check" CHECK ("notifications"."type" IN ('meeting_invitation', 'payment_reminder', 'payment_confirmation', 'payment_notice'))
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"apartment_id" uuid NOT NULL,
	"ownership_date" date NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"charge_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"payment_date" date NOT NULL,
	"method" text NOT NULL,
	"reference" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_method_check" CHECK ("payments"."method" IN ('bank_transfer', 'check', 'cash'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"role" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('syndic', 'proprietaire'))
);
--> statement-breakpoint
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_syndic_id_users_id_fk" FOREIGN KEY ("syndic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_syndic_id_users_id_fk" FOREIGN KEY ("syndic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_syndic_id_users_id_fk" FOREIGN KEY ("syndic_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_charge_id_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apartments_building_id_idx" ON "apartments" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "apartments_status_idx" ON "apartments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "buildings_syndic_id_idx" ON "buildings" USING btree ("syndic_id");--> statement-breakpoint
CREATE INDEX "charges_apartment_id_idx" ON "charges" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "charges_syndic_id_idx" ON "charges" USING btree ("syndic_id");--> statement-breakpoint
CREATE INDEX "charges_due_date_idx" ON "charges" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "charges_deleted_at_idx" ON "charges" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "meeting_invitations_meeting_id_idx" ON "meeting_invitations" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "meeting_invitations_owner_id_idx" ON "meeting_invitations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "meetings_syndic_id_idx" ON "meetings" USING btree ("syndic_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "owners_user_id_idx" ON "owners" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "owners_apartment_id_idx" ON "owners" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "owners_deleted_at_idx" ON "owners" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "payments_charge_id_idx" ON "payments" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "payments_owner_id_idx" ON "payments" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");