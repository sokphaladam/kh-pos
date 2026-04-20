CREATE TABLE IF NOT EXISTS `backlog_orders` (
  `id` char(50) NOT NULL,
  `slot_id` char(50) NOT NULL,
  `variant_id` char(50) NOT NULL,
  `qty` int NOT NULL,
  `created_by` char(50) NOT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `slot_id_variant_id` (`slot_id`,`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Backlog orders prevent negative stock qty and does not block sales. Allows user to resolve the negative stock qty later. Another function is to also prevent deadlock.';

CREATE TABLE IF NOT EXISTS `customer` (
  `id` char(50) NOT NULL,
  `customer_name` varchar(50) NOT NULL DEFAULT '',
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `pos_warehouse_id` char(50) DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `customer_order` (
  `order_id` char(50) NOT NULL,
  `customer_id` char(50) NOT NULL,
  `warehouse_id` char(50) NOT NULL,
  `order_status` enum('DRAFT','APPROVED','PROCESSING','COMPLETED','CANCELLED','REFUND') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'DRAFT' COMMENT 'draft: for online order and that business that they have to issue the note to find items',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `delivery_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'for online order',
  `address_lat` varchar(50) DEFAULT NULL,
  `address_lng` varchar(50) DEFAULT NULL,
  `table_number` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'for restaurant',
  `created_by` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `refund_at` datetime DEFAULT NULL,
  `invoice_no` bigint DEFAULT NULL,
  `transfer_by` varchar(255) DEFAULT NULL,
  `transfer_at` datetime DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `unique_warehouse_invoice_no` (`warehouse_id`,`invoice_no`),
  KEY `invoice_no_index` (`invoice_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `customer_order_detail` (
  `order_detail_id` char(50) NOT NULL,
  `order_id` char(50) DEFAULT NULL,
  `variant_id` char(50) DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `fulfilled_qty` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `modifer_amount` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL COMMENT 'total_amount = (price * qty) - discount_amount + modifier_amount',
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`order_detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `discount` (
  `discount_id` char(50) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `discount_type` enum('AMOUNT','PERCENTAGE') NOT NULL DEFAULT 'PERCENTAGE',
  `value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `update_at` datetime DEFAULT NULL,
  `created_by` char(50) NOT NULL,
  `updated_by` char(50) NOT NULL,
  `warehouse_id` char(50) DEFAULT NULL,
  `auto_id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`discount_id`),
  UNIQUE KEY `auto_id` (`auto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `discount_log` (
  `id` char(50) NOT NULL,
  `discount_id` char(50) DEFAULT NULL,
  `order_detail_id` char(50) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `discount_title` varchar(255) DEFAULT NULL,
  `discount_type` enum('PERCENTAGE','AMOUNT') DEFAULT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_manual_discount` tinyint(1) DEFAULT '0',
  `created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fulfill_replenishment` (
  `id` char(50) NOT NULL,
  `replenishment_id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fulfill_replenishment_detail` (
  `id` char(50) NOT NULL,
  `replenishment_item_id` char(50) DEFAULT NULL,
  `fulfill_replenishment_id` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fulfilment` (
  `id` char(50) NOT NULL,
  `order_id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `fulfilment_detail` (
  `id` char(50) NOT NULL,
  `order_detail_id` char(50) DEFAULT NULL,
  `fulfilment_id` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `inventory` (
  `id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT (uuid()),
  `slot_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `variant_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expired_at` datetime DEFAULT NULL,
  `lot_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `qty` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `inventory_variant_id_index` (`variant_id`),
  KEY `inventory_slot_id_index` (`slot_id`),
  KEY `inventory_variant_id_slot_id_index` (`variant_id`,`slot_id`),
  KEY `inventory_lot_id_index` (`lot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='It is used to store product in different slot and warehouse';

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `transaction_type` enum('STOCK_IN','STOCK_OUT','DAMAGE','RETURN','TRANSFER','ADJUSTMENT_IN','ADJUSTMENT_OUT','SALE','PURCHASE','REPLENISHMENT','REPLENISHMENT_OUT','COMPOSE_IN','COMPOSE_OUT','TRANSFER_IN','TRANSFER_OUT','CONVERSION_IN','CONVERSION_OUT') DEFAULT NULL,
  `variant_id` char(50) NOT NULL,
  `slot_id` char(50) NOT NULL,
  `lot_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `qty` int NOT NULL,
  `created_by` char(50) NOT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `modifier` (
  `modifier_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT NULL,
  `update_at` datetime DEFAULT NULL,
  `created_by` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `updated_by` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`modifier_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `modifier_items` (
  `id` char(36) NOT NULL,
  `modifier_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime NOT NULL,
  `created_by` char(36) NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_detail_modifier` (
  `order_detail_id` char(50) NOT NULL,
  `modifier_item_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notes` text,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`order_detail_id`,`modifier_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_item_status` (
  `order_item_id` char(36) NOT NULL,
  `status` enum('pending','cooking','ready','served','cancelled') NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` char(36) NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`order_item_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_payment` (
  `payment_id` char(50) NOT NULL,
  `payment_method` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `currency` enum('USD','KHR') DEFAULT 'USD',
  `amount` decimal(10,2) DEFAULT '0.00',
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  `order_id` char(50) DEFAULT NULL,
  `exchange_rate` decimal(10,2) DEFAULT NULL,
  `amount_usd` decimal(10,2) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` char(50) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(50) DEFAULT NULL,
  `shift_id` char(50) DEFAULT NULL,
  `amount_used` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_return` (
  `id` char(36) NOT NULL,
  `warehouse_id` char(36) DEFAULT NULL,
  `order_id` char(36) NOT NULL,
  `order_item_id` char(36) NOT NULL,
  `quantity` int NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `reason` varchar(255) DEFAULT '',
  `status` enum('returned','stock_in') DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `returned_by` char(36) DEFAULT NULL,
  `stock_in_at` datetime DEFAULT NULL,
  `stock_in_by` char(36) DEFAULT NULL,
  `shift_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_status_log` (
  `id` char(50) NOT NULL,
  `order_id` char(50) NOT NULL,
  `order_status` enum('DRAFT','APPROVED','PROCESSING','COMPLETED','CANCELLED','REFUND') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_method` (
  `method_id` char(50) NOT NULL,
  `method` varchar(255) DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`method_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `print_queue` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `content` json NOT NULL,
  `printer_info` json NOT NULL,
  `warehouse_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `title` varchar(255) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `weight` int DEFAULT NULL COMMENT 'weight in gram',
  `length` int DEFAULT NULL COMMENT 'length in cm',
  `height` int DEFAULT NULL COMMENT 'height in cm',
  `width` int DEFAULT NULL COMMENT 'width in cm',
  `is_composite` tinyint DEFAULT '0' COMMENT 'this product is made from other products'' skus',
  `use_production` tinyint DEFAULT '0' COMMENT 'support production procedure',
  `track_stock` tinyint DEFAULT '0' COMMENT 'enable to track stock qty, low stock, optimal stock(autofill the item qty in PO), add supplier and supplier cost',
  `is_for_sale` tinyint DEFAULT '0' COMMENT 'some product is not available for sale',
  `created_by` char(50) DEFAULT NULL,
  `updated_by` char(50) DEFAULT NULL,
  `deleted_by` char(50) DEFAULT NULL,
  `supplier_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_supplier_id_foreign` (`supplier_id`),
  FULLTEXT KEY `product_title_fulltext` (`title`) /*!50100 WITH PARSER `ngram` */ 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='this is the main product table';

CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT (uuid()),
  `product_id` char(50) NOT NULL,
  `category_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id_product_category_id` (`product_id`,`category_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='This table indicate which product is in which category.\r\nOne product can be in multiple categories';

CREATE TABLE IF NOT EXISTS `product_category` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `title` varchar(255) NOT NULL,
  `description` text,
  `parent_id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `delete_date` datetime DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `printer_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='this is the main product category table';

CREATE TABLE IF NOT EXISTS `product_discount` (
  `product_id` char(50) NOT NULL,
  `discount_id` char(50) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `is_applied_all` tinyint(1) DEFAULT '0',
  `category_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `product_id` char(50) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `product_variant_id` char(50) DEFAULT NULL,
  `image_order` int DEFAULT NULL COMMENT '1 is the main image, 2 is the second image, and so on',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='It is used to store product images';

CREATE TABLE IF NOT EXISTS `product_lot` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `variant_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `lot_number` varchar(255) DEFAULT NULL,
  `manufacturing_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL COMMENT 'cost of the product per unit',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_modifier` (
  `product_id` char(50) NOT NULL,
  `modifier_id` char(50) NOT NULL,
  PRIMARY KEY (`product_id`,`modifier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_option` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `name` varchar(50) NOT NULL,
  `product_id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title_product_id` (`name`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='product option table is used to indicate how many options (size, color, etc) in a product and what they are.';

CREATE TABLE IF NOT EXISTS `product_option_value` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `product_option_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `value` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value_product_option_id` (`value`,`product_option_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='this table is used to store the value of each option. For example: \r\noption: ''size'', value: ''M''\r\noption: ''color'', value: ''Pink''\r\n';

CREATE TABLE IF NOT EXISTS `product_variant` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `product_id` char(50) NOT NULL,
  `sku` int NOT NULL AUTO_INCREMENT,
  `barcode` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `available` tinyint NOT NULL DEFAULT '1',
  `purchased_cost` decimal(10,2) NOT NULL,
  `low_stock_qty` int DEFAULT NULL,
  `ideal_stock_qty` int DEFAULT NULL,
  `is_composite` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `product_variant_barcode_unique` (`barcode`),
  KEY `product_variant_product_id_index` (`product_id`),
  KEY `product_variant_sku_index` (`sku`),
  KEY `product_variant_barcode_index` (`barcode`),
  KEY `product_variant_available_index` (`available`),
  KEY `product_variant_deleted_at_index` (`deleted_at`),
  KEY `product_variant_is_composite_index` (`is_composite`)
) ENGINE=InnoDB AUTO_INCREMENT=100091 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='this table is used to indicate how many variants in a product\r\nthe option combination is in table product_variant_option';

CREATE TABLE IF NOT EXISTS `product_variant_by_warehouse` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `product_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `variant_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `warehouse_id` char(50) NOT NULL,
  `stock` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `low_stock` int DEFAULT NULL,
  `ideal_stock` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `enable` tinyint DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `variant_id_warehouse_id` (`variant_id`,`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_variant_conversion` (
  `from_variant_id` varchar(255) NOT NULL COMMENT 'e.g., A1-box',
  `to_variant_id` varchar(255) NOT NULL COMMENT 'e.g., A2-package',
  `product_id` varchar(255) NOT NULL,
  `conversion_rate` int NOT NULL COMMENT 'e.g., 6 means 1 box = 6 packages',
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`from_variant_id`,`to_variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `product_variant_options` (
  `product_variant_id` char(50) NOT NULL,
  `option_value_id` char(50) NOT NULL,
  PRIMARY KEY (`product_variant_id`,`option_value_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='This table tells what option of each variant';

CREATE TABLE IF NOT EXISTS `receive_po` (
  `id` char(50) NOT NULL,
  `po_Id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `receive_po_detail` (
  `id` char(50) NOT NULL,
  `receive_id` char(50) DEFAULT NULL,
  `transaction_id` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `receive_replenishment` (
  `id` char(50) NOT NULL,
  `replenishment_id` char(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `receive_replenishment_detail` (
  `id` char(50) NOT NULL,
  `receive_id` char(50) DEFAULT NULL,
  `transaction_id` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `replenishment` (
  `replenish_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT (uuid()),
  `from_warehouse` char(50) DEFAULT NULL,
  `to_warehouse` char(50) DEFAULT NULL,
  `status` enum('draft','approved','receiving','received','deleted') DEFAULT 'draft',
  `created_at` datetime DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` char(50) DEFAULT NULL,
  `receiving_at` datetime DEFAULT NULL,
  `receiving_by` char(50) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `received_by` char(50) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(50) DEFAULT NULL,
  `auto_id` int NOT NULL AUTO_INCREMENT,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`replenish_id`),
  UNIQUE KEY `auto_id` (`auto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `replenishment_items` (
  `replenish_items_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT (uuid()),
  `replenish_id` char(50) DEFAULT NULL,
  `product_variant_id` char(50) DEFAULT NULL,
  `sent_qty` int DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `received_qty` int DEFAULT NULL,
  `receiving_at` datetime DEFAULT NULL,
  `receiving_by` char(50) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `received_by` char(50) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(50) DEFAULT NULL,
  `fulfilled_qty` int DEFAULT '0',
  PRIMARY KEY (`replenish_items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `replenishment_picking_list` (
  `variant_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `slot_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `qty` int NOT NULL DEFAULT '0',
  `replenishment_id` char(50) NOT NULL,
  PRIMARY KEY (`variant_id`,`slot_id`,`replenishment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `restaurant_tables` (
  `id` char(36) NOT NULL,
  `table_name` varchar(255) NOT NULL,
  `setting_capacity` int NOT NULL,
  `section` varchar(255) DEFAULT NULL,
  `table_shape` varchar(255) DEFAULT NULL,
  `location_description` varchar(255) DEFAULT NULL,
  `special_features` text,
  `addional_notes` text,
  `status` enum('available','order_taken','cleaning') DEFAULT 'available',
  `created_at` datetime NOT NULL,
  `created_by` char(36) NOT NULL,
  `warehouse_id` char(36) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `return_stock_in_transaction` (
  `return_id` char(36) NOT NULL,
  `transaction_id` char(36) NOT NULL,
  PRIMARY KEY (`return_id`,`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `schedule_supplier_product_prices` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `supplier_id` char(50) NOT NULL,
  `product_variant_id` char(50) NOT NULL,
  `product_unit_id` char(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `valid_from` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='cron will write new supplier product price into table supplier_product_price when valid_from date is arrived';

CREATE TABLE IF NOT EXISTS `seeds_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `seed_name` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seeds_log_seed_name_unique` (`seed_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `option` varchar(255) DEFAULT NULL,
  `value` text,
  `warehouse` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `shift` (
  `shift_id` char(50) NOT NULL,
  `opened_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `opened_cash_usd` decimal(10,2) DEFAULT NULL,
  `closed_cash_usd` decimal(10,2) DEFAULT NULL,
  `opened_by` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` enum('OPEN','CLOSE') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'OPEN',
  `updated_at` datetime DEFAULT NULL,
  `opened_cash_khr` decimal(10,2) DEFAULT NULL,
  `closed_cash_khr` decimal(10,2) DEFAULT NULL,
  `closed_by` char(50) DEFAULT NULL,
  `actual_cash_usd` decimal(10,2) DEFAULT NULL,
  `actual_cash_khr` decimal(10,2) DEFAULT NULL,
  `receipt` json DEFAULT NULL,
  `exchange_rate` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`shift_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `name` varchar(255) NOT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `address` text,
  `note` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `delete_date` datetime DEFAULT NULL,
  `is_consignment` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier_po_addition_cost` (
  `id` char(50) NOT NULL,
  `supplier_po_id` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` enum('pending','received','cancelled') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier_product_prices` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `supplier_id` char(50) NOT NULL,
  `product_variant_id` char(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `effect_date` datetime DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `scheduled_price` decimal(10,2) DEFAULT NULL,
  `scheduled_by` varchar(255) DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier_purchase_order` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `supplier_id` char(50) NOT NULL,
  `warehouse_id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` enum('pending','partially','draft','approved','completed','deleted','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft',
  `total` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `purchased_at` datetime DEFAULT NULL,
  `expected_at` datetime DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `po_increment` int NOT NULL AUTO_INCREMENT,
  `created_by` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_increment` (`po_increment`),
  UNIQUE KEY `po_increment_2` (`po_increment`),
  UNIQUE KEY `po_increment_3` (`po_increment`),
  UNIQUE KEY `po_increment_4` (`po_increment`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier_purchase_order_detail` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `supplier_purchase_order_id` char(50) NOT NULL,
  `product_variant_id` char(50) NOT NULL,
  `quantity` int NOT NULL,
  `purchased_cost` decimal(10,2) NOT NULL,
  `status` enum('pending','received','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `received_qty` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `done` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `username` varchar(50) NOT NULL,
  `phone_number` varchar(100) NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `app` enum('ALL','IMS','POS','BOM') NOT NULL,
  `is_root` tinyint DEFAULT '0',
  `fullname` varchar(255) DEFAULT NULL,
  `profile` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint DEFAULT '0',
  `role_id` char(50) DEFAULT NULL,
  `warehouse_id` char(50) DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_activity_logs` (
  `log_id` char(50) NOT NULL DEFAULT (uuid()),
  `user_id` char(50) NOT NULL,
  `action` varchar(255) NOT NULL,
  `table_name` text,
  `timestamp` datetime DEFAULT NULL,
  `key` varchar(255) NOT NULL COMMENT 'This key will be used to group activities later',
  `content` json NOT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='We need to log every user activities in this table';

CREATE TABLE IF NOT EXISTS `user_role` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_default` tinyint DEFAULT '0',
  `permissions` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`role`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `variables` (
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `value` json DEFAULT NULL,
  PRIMARY KEY (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `variant_composite` (
  `id` char(36) NOT NULL,
  `variant_composite_id` char(36) NOT NULL,
  `variant_component_id` char(36) NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `warehouse` (
  `id` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT (uuid()),
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_main` tinyint NOT NULL DEFAULT '0' COMMENT 'There is only one main warehouse',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint DEFAULT '0',
  `owner_name` varchar(100) DEFAULT NULL,
  `created_by` char(50) DEFAULT NULL,
  `updated_by` char(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `warehouse_slot` (
  `id` char(50) NOT NULL DEFAULT (uuid()),
  `slot_name` varchar(255) NOT NULL,
  `warehouse_id` char(50) NOT NULL,
  `slot_capacity` int DEFAULT NULL COMMENT 'slot capacity in meter cube',
  `slot_status` enum('ACTIVE','INACTIVE') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_deleted` tinyint DEFAULT '0',
  `pos_slot` tinyint DEFAULT '0',
  `created_by` char(50) DEFAULT NULL,
  `updated_by` char(50) DEFAULT NULL,
  `for_replenishment` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `warehouse_slot_warehouse_id_index` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='It is used to store warehouse slot information';