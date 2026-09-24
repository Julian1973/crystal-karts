CREATE TABLE `kart_attempts` (
	`guest` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`track` text NOT NULL,
	`bear` integer NOT NULL,
	`started` integer NOT NULL,
	FOREIGN KEY (`guest`) REFERENCES `kart_guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kart_bests` (
	`guest` text NOT NULL,
	`track` text NOT NULL,
	`rules` text NOT NULL,
	`bear` integer NOT NULL,
	`ms` integer NOT NULL,
	`challenge` text NOT NULL,
	PRIMARY KEY(`guest`, `track`, `rules`),
	FOREIGN KEY (`guest`) REFERENCES `kart_guests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `kart_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`track` text NOT NULL,
	`bear` integer NOT NULL,
	`ms` integer NOT NULL,
	`rules` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kart_guests` (
	`id` text PRIMARY KEY NOT NULL,
	`progress` text DEFAULT '{}' NOT NULL
);
