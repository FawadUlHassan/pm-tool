-- backend/migrations/001_create_column_orders.sql

-- Create column_orders table to persist each user’s column layout
CREATE TABLE IF NOT EXISTS `column_orders` (
  `user_id`     INT         NOT NULL,
  `field_order` JSON        NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_column_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
