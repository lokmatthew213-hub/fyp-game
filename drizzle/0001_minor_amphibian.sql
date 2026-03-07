CREATE TABLE `answerHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`playerName` varchar(128) NOT NULL,
	`sentence` text NOT NULL,
	`isCorrect` int NOT NULL,
	`feedback` text NOT NULL,
	`strategy` varchar(1) NOT NULL,
	`contextCardName` varchar(128) NOT NULL,
	`contextCardBase` int NOT NULL,
	`gameMode` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `answerHistory_id` PRIMARY KEY(`id`)
);
