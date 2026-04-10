ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "birth_date" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "protein_percent" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "fat_percent" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "carb_percent" integer;
