-- AizenGo PHP API schema (MySQL 8+/MariaDB 10.5+).
-- Do not run this on an existing Prisma database: it already has equivalent tables.

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'USER',
  `avatar` VARCHAR(2048) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Session` (
  `tokenHash` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`tokenHash`),
  KEY `Session_userId_idx` (`userId`),
  KEY `Session_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DataRecord` (
  `id` VARCHAR(191) NOT NULL,
  `resource` VARCHAR(191) NOT NULL,
  `recordKey` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DataRecord_resource_recordKey_key` (`resource`, `recordKey`),
  KEY `DataRecord_resource_idx` (`resource`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
