CREATE TABLE `customUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`displayName` varchar(64) NOT NULL,
	`role` enum('student','teacher') NOT NULL DEFAULT 'student',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customUsers_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `gameRooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomCode` varchar(8) NOT NULL,
	`hostUserId` int NOT NULL,
	`status` enum('waiting','playing','finished') NOT NULL DEFAULT 'waiting',
	`playersJson` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameRooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `gameRooms_roomCode_unique` UNIQUE(`roomCode`)
);
