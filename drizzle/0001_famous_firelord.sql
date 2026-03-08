ALTER TABLE "apartments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "apartments_deleted_at_idx" ON "apartments" USING btree ("deleted_at");