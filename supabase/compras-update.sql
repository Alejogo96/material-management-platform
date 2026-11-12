ALTER TABLE "purchase_requests" ADD COLUMN "purchase_order_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD COLUMN "unit_price" numeric(12, 4);