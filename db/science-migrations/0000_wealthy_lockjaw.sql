CREATE TABLE `science_billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `science_checkout_intents` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`session_id` text,
	`subscription_id` text
);
--> statement-breakpoint
CREATE TABLE `science_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`customer_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`eligible` integer DEFAULT 0 NOT NULL,
	`paid_start` integer DEFAULT 0 NOT NULL,
	`paid_through` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`canceled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `science_usage` (
	`key` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
