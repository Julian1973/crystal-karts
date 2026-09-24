CREATE TABLE `kart_arcade_records` (
	`guest` text NOT NULL,
	`track` text NOT NULL,
	`rules` text NOT NULL,
	`challenge` text NOT NULL,
	`name` text NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`listed` integer DEFAULT 0 NOT NULL,
	`ms` integer NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`guest`, `track`, `rules`),
	FOREIGN KEY (`guest`) REFERENCES `kart_guests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge`) REFERENCES `kart_challenges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `arcade_board_order` ON `kart_arcade_records` (`track`,`rules`,`listed`,`ms`);