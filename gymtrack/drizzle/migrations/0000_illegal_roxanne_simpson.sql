CREATE TYPE "public"."fitness_goal" AS ENUM('mass', 'strength', 'definition', 'endurance');--> statement-breakpoint
CREATE TYPE "public"."muscle_group" AS ENUM('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('planned', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "body_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"weight_kg" real,
	"body_fat_percent" real,
	"chest_cm" real,
	"waist_cm" real,
	"hips_cm" real,
	"bicep_cm" real,
	"thigh_cm" real,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exercise_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"muscle_group" "muscle_group" NOT NULL,
	"notes" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_plan_id" uuid NOT NULL,
	"exercise_template_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"planned_sets" integer NOT NULL,
	"planned_reps" integer NOT NULL,
	"planned_weight_kg" real NOT NULL,
	"default_rest_seconds" integer DEFAULT 90 NOT NULL,
	"rest_overrides" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "set_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_template_id" uuid NOT NULL,
	"planned_exercise_id" uuid,
	"set_number" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight_kg" real NOT NULL,
	"rest_seconds_actual" integer,
	"is_personal_record" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"age" integer,
	"height_cm" real,
	"current_weight_kg" real,
	"target_weight_kg" real,
	"sex" text,
	"experience_level" text,
	"fitness_goal" "fitness_goal",
	"preferred_unit" text DEFAULT 'kg' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"workout_plan_id" uuid,
	"status" "session_status" DEFAULT 'planned' NOT NULL,
	"is_manual_entry" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"scheduled_for" timestamp NOT NULL,
	"total_volume_kg" real,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "body_measurements" ADD CONSTRAINT "body_measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_templates" ADD CONSTRAINT "exercise_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_workout_plan_id_workout_plans_id_fk" FOREIGN KEY ("workout_plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_exercises" ADD CONSTRAINT "planned_exercises_exercise_template_id_exercise_templates_id_fk" FOREIGN KEY ("exercise_template_id") REFERENCES "public"."exercise_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_exercise_template_id_exercise_templates_id_fk" FOREIGN KEY ("exercise_template_id") REFERENCES "public"."exercise_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_logs" ADD CONSTRAINT "set_logs_planned_exercise_id_planned_exercises_id_fk" FOREIGN KEY ("planned_exercise_id") REFERENCES "public"."planned_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_workout_plan_id_workout_plans_id_fk" FOREIGN KEY ("workout_plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "measurements_user_date_idx" ON "body_measurements" USING btree ("user_id","measured_at");--> statement-breakpoint
CREATE INDEX "exercise_templates_user_idx" ON "exercise_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercise_templates_name_idx" ON "exercise_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "planned_exercises_plan_idx" ON "planned_exercises" USING btree ("workout_plan_id");--> statement-breakpoint
CREATE INDEX "set_logs_session_idx" ON "set_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "set_logs_exercise_idx" ON "set_logs" USING btree ("exercise_template_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "workout_plans_user_day_idx" ON "workout_plans" USING btree ("user_id","day_of_week");--> statement-breakpoint
CREATE INDEX "sessions_user_date_idx" ON "workout_sessions" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "workout_sessions" USING btree ("status");