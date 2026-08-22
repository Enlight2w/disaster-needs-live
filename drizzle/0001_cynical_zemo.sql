CREATE TABLE `responderCommitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`needId` varchar(80) NOT NULL,
	`responderId` int NOT NULL,
	`status` enum('committed','withdrawn') NOT NULL DEFAULT 'committed',
	`evidenceKey` varchar(768),
	`evidenceUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responderCommitments_id` PRIMARY KEY(`id`),
	CONSTRAINT `responderCommitments_responder_need_unique` UNIQUE(`responderId`,`needId`)
);
--> statement-breakpoint
ALTER TABLE `responderCommitments` ADD CONSTRAINT `responderCommitments_responderId_users_id_fk` FOREIGN KEY (`responderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;