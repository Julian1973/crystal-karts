CREATE TABLE `race_members` (
	`token` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`bear` integer NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`input` text DEFAULT '{}' NOT NULL,
	`seen` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `race_rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `race_member_bear` ON `race_members` (`room`,`bear`);--> statement-breakpoint
CREATE INDEX `race_member_room` ON `race_members` (`room`);--> statement-breakpoint
CREATE TABLE `race_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`phase` text DEFAULT 'lobby' NOT NULL,
	`snapshot` text,
	`updated` integer NOT NULL,
	`expires` integer NOT NULL
);
