CREATE TYPE "public"."inspection_status" AS ENUM('pending', 'passed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('pending', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."project_type" AS ENUM('rough_in', 'trim', 'both', 'service_call', 'other');--> statement-breakpoint
CREATE TABLE "company_settings" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"approval_threshold" numeric(12, 2) DEFAULT '500' NOT NULL,
	"excess_pct" integer DEFAULT 10 NOT NULL,
	"reminder_hours" integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid,
	"kind" text NOT NULL,
	"detail" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"phase_id" uuid,
	"name" text NOT NULL,
	"due_date" date,
	"status" "inspection_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"spec" text,
	"status" "phase_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "locale" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" "project_type" DEFAULT 'rough_in' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type_other" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "van_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_events" ADD CONSTRAINT "project_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_inspections" ADD CONSTRAINT "project_inspections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_inspections" ADD CONSTRAINT "project_inspections_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_events_project_idx" ON "project_events" USING btree ("project_id","created_at");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_van_id_locations_id_fk" FOREIGN KEY ("van_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE public."project_phases" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."project_inspections" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."project_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."company_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
UPDATE users SET locale = 'en';
--> statement-breakpoint
UPDATE users SET is_admin = true WHERE full_name IN ('Miguel Salomón', 'Andrés Lira', 'Jimmy', 'Karina');
--> statement-breakpoint
UPDATE users u SET team_id = l.id FROM locations l WHERE l.kind = 'van' AND l.responsible_user_id = u.id;
--> statement-breakpoint
UPDATE projects SET type = 'service_call' WHERE kind = 'service_call';
--> statement-breakpoint
UPDATE projects p SET van_id = (SELECT id FROM locations WHERE kind = 'van' AND company_id = p.company_id ORDER BY name LIMIT 1) WHERE van_id IS NULL AND kind = 'project';
--> statement-breakpoint
INSERT INTO company_settings (company_id) SELECT id FROM companies ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO project_events (project_id, kind, detail, created_at) SELECT id, 'created', 'Project created', created_at FROM projects p WHERE NOT EXISTS (SELECT 1 FROM project_events e WHERE e.project_id = p.id);
