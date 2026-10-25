CREATE TABLE `science_paid_periods` (
	`key` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL
);
