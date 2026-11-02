CREATE TYPE "public"."card_status" AS ENUM('unclaimed', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('mobile', 'tablet', 'desktop', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."link_type" AS ENUM('instagram', 'facebook', 'tiktok', 'linkedin', 'x', 'youtube', 'telegram', 'custom');--> statement-breakpoint
CREATE TYPE "public"."tap_source" AS ENUM('nfc', 'qr', 'link');--> statement-breakpoint
CREATE TABLE "card_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_batches_quantity_range" CHECK ("card_batches"."quantity" between 1 and 10000)
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"batch_id" uuid,
	"owner_id" uuid,
	"profile_id" uuid,
	"status" "card_status" DEFAULT 'unclaimed' NOT NULL,
	"label" text,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cards_code_format" CHECK ("cards"."code" ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$'),
	CONSTRAINT "cards_unclaimed_is_empty" CHECK ("cards"."status" <> 'unclaimed' or ("cards"."owner_id" is null and "cards"."profile_id" is null and "cards"."claimed_at" is null))
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"company" text,
	"message" text,
	"consent" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_consent_given" CHECK ("leads"."consent"),
	CONSTRAINT "leads_has_contact" CHECK ("leads"."phone" is not null or "leads"."email" is not null)
);
--> statement-breakpoint
CREATE TABLE "profile_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" "link_type" NOT NULL,
	"label" text,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_links_url_format" CHECK ("profile_links"."url" ~* '^https?://')
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"job_title" text,
	"company" text,
	"bio" text,
	"avatar_path" text,
	"cover_path" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"website" text,
	"address" text,
	"maps_url" text,
	"theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"allow_indexing" boolean DEFAULT false NOT NULL,
	"lead_form_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_slug_format" CHECK ("profiles"."slug" ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
	CONSTRAINT "profiles_display_name_length" CHECK (char_length("profiles"."display_name") between 1 and 80),
	CONSTRAINT "profiles_bio_length" CHECK (char_length("profiles"."bio") <= 500)
);
--> statement-breakpoint
CREATE TABLE "tap_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid,
	"profile_id" uuid NOT NULL,
	"source" "tap_source" NOT NULL,
	"user_agent" text,
	"device_type" "device_type" DEFAULT 'unknown' NOT NULL,
	"country" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_batches" ADD CONSTRAINT "card_batches_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_batch_id_card_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."card_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_links" ADD CONSTRAINT "profile_links_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_events" ADD CONSTRAINT "tap_events_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tap_events" ADD CONSTRAINT "tap_events_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cards_code_key" ON "cards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "cards_owner_id_idx" ON "cards" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cards_batch_id_idx" ON "cards" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "leads_profile_created_idx" ON "leads" USING btree ("profile_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "profile_links_profile_position_idx" ON "profile_links" USING btree ("profile_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "profiles_owner_id_idx" ON "profiles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tap_events_profile_created_idx" ON "tap_events" USING btree ("profile_id","created_at" DESC NULLS LAST);