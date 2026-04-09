CREATE TABLE "activity_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer,
	"calories_burned" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pfc_decimal_enabled" boolean DEFAULT false,
	"height_unit" text DEFAULT 'cm',
	"weight_unit" text DEFAULT 'kg',
	"home_card_type" text DEFAULT 'toggle',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "meal_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"calories" integer,
	"protein_grams" integer,
	"fat_grams" integer,
	"carb_grams" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "memo" text;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "target_body_fat_percent" numeric;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "protein_percent" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "fat_percent" integer;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "carb_percent" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "body_fat_percent" numeric;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD COLUMN "body_fat_percent" numeric;--> statement-breakpoint
ALTER TABLE "activity_favorites" ADD CONSTRAINT "activity_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_favorites" ADD CONSTRAINT "meal_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;