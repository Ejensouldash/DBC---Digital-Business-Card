ALTER TABLE "leads" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "card_image_path" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "card_design" jsonb;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source" text DEFAULT 'web_form' NOT NULL;