CREATE TABLE "profile_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"path" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "industry" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "office_phone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_website" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "company_logo_path" text;--> statement-breakpoint
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_photos_profile_position_idx" ON "profile_photos" USING btree ("profile_id","position");