ALTER TABLE `files`
  ADD COLUMN `starred_at` DATETIME(3) NULL;

CREATE INDEX `files_user_id_starred_at_idx` ON `files`(`user_id`, `starred_at`);