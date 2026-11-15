CREATE TABLE `synapsy_premium_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`revision` integer NOT NULL,
	`data_json` text NOT NULL,
	`listed` integer NOT NULL,
	`expires_at` text NOT NULL,
	`last_operation_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "synapsy_premium_candidate_revision" CHECK("synapsy_premium_candidates"."revision">0),
	CONSTRAINT "synapsy_premium_candidate_listed" CHECK("synapsy_premium_candidates"."listed" IN (0,1)),
	CONSTRAINT "synapsy_premium_candidate_json" CHECK(json_valid("synapsy_premium_candidates"."data_json") AND json_type("synapsy_premium_candidates"."data_json")='object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `synapsy_premium_candidate_owner` ON `synapsy_premium_candidates` (`owner_id`);--> statement-breakpoint
CREATE INDEX `synapsy_premium_candidate_catalog` ON `synapsy_premium_candidates` (`listed`,`expires_at`,`updated_at`);--> statement-breakpoint
CREATE TABLE `synapsy_premium_operations` (
	`actor_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`target_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`actor_id`, `operation_id`),
	CONSTRAINT "synapsy_premium_operation_hash" CHECK(length("synapsy_premium_operations"."request_hash")=64)
);
--> statement-breakpoint
CREATE INDEX `synapsy_premium_operations_actor_time` ON `synapsy_premium_operations` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `synapsy_premium_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_id` text NOT NULL,
	`professional_id` text NOT NULL,
	`professional_name` text NOT NULL,
	`company` text NOT NULL,
	`purpose` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`candidate_revision` integer NOT NULL,
	`expires_at` text NOT NULL,
	`approved_at` text,
	`policy` text,
	`last_operation_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "synapsy_premium_request_status" CHECK("synapsy_premium_requests"."status" IN ('requested','approved','declined','revoked')),
	CONSTRAINT "synapsy_premium_request_revision" CHECK("synapsy_premium_requests"."revision">0 AND "synapsy_premium_requests"."candidate_revision">0),
	CONSTRAINT "synapsy_premium_request_purpose" CHECK("synapsy_premium_requests"."purpose" IN ('property','bnb'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `synapsy_premium_request_pair` ON `synapsy_premium_requests` (`candidate_id`,`professional_id`);--> statement-breakpoint
CREATE INDEX `synapsy_premium_request_candidate` ON `synapsy_premium_requests` (`candidate_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `synapsy_premium_request_professional` ON `synapsy_premium_requests` (`professional_id`,`created_at`);