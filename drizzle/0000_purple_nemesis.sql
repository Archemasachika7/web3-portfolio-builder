CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`repo_url` text,
	`nft_badge_url` text,
	`ipfs_cid` text,
	`ipfs_url` text,
	`ipfs_pinned` integer DEFAULT 0 NOT NULL,
	`asset_name` text,
	`asset_size` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`updated_at` integer NOT NULL
);
