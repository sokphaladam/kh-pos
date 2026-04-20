# L-POS Database Schema Documentation

**Database:** bayon-stage  
**Server:** l-pos-small-mart-do-user-2722838-0.g.db.ondigitalocean.com  
**Generated:** March 6, 2026  
**Total Tables:** 74

---

## 📊 Database Overview

L-POS is a comprehensive Point of Sale system supporting:

- **Multi-warehouse** inventory management
- **Restaurant** operations (dine-in, takeaway, delivery)
- **Cinema/Theater** management (movies, showtimes, seat reservations)
- **Retail** sales with product variants and composite products
- **Supplier purchasing** and stock replenishment
- **Role-based access control** (RBAC)
- **Dual currency** support (USD, KHR)

### Table Statistics

| Table                 | Rows  | Size   | Purpose                        |
| --------------------- | ----- | ------ | ------------------------------ |
| cron_log              | 8,236 | 5.8 MB | Scheduled job execution logs   |
| cinema_seat           | 450   | 98 KB  | Theater seating inventory      |
| customer_order        | 123   | 64 KB  | Customer purchase orders       |
| customer_order_detail | 127   | 64 KB  | Order line items               |
| customer_token        | 54    | 16 KB  | Customer authentication tokens |
| discount_log          | 26    | 16 KB  | Applied discount history       |

---

## 🏗️ Architecture Patterns

### Core Conventions

| Pattern             | Implementation                                                   |
| ------------------- | ---------------------------------------------------------------- |
| **Primary Keys**    | UUID (char 36-50) for business entities, auto-increment for logs |
| **Soft Deletes**    | `deleted_at`, `deleted_by` columns (NULL = active)               |
| **Audit Trail**     | `created_at`, `updated_at`, `created_by`, `updated_by`           |
| **Multi-Warehouse** | Most entities scoped by `warehouse_id`                           |
| **Foreign Keys**    | Implied through `{table}_id` naming convention                   |
| **Status Enums**    | Database-level enums for workflow states                         |
| **JSON Fields**     | Semi-structured data (permissions, metadata, configurations)     |
| **Dual Currency**   | `exchange_rate` field normalizes KHR ↔ USD                       |

---

## 📦 1. PRODUCT MANAGEMENT

### product

**Purpose:** Master product catalog

| Column                             | Type          | Key | Description                   |
| ---------------------------------- | ------------- | --- | ----------------------------- |
| id                                 | char(36)      | PK  | UUID                          |
| title                              | varchar(255)  |     | Product name                  |
| description                        | text          |     | Product description           |
| supplier_id                        | char(36)      | FK  | Links to supplier             |
| is_composite                       | tinyint(1)    |     | Assembled from other products |
| use_production                     | tinyint(1)    |     | Requires production/assembly  |
| track_stock                        | tinyint(1)    |     | Enable inventory tracking     |
| is_for_sale                        | tinyint(1)    |     | Available for customer orders |
| weight                             | decimal(10,2) |     | Weight in grams               |
| length, width, height              | decimal(10,2) |     | Dimensions in cm              |
| created_at, updated_at             | datetime      |     | Timestamps                    |
| deleted_at                         | datetime      |     | Soft delete timestamp         |
| created_by, updated_by, deleted_by | char(36)      | FK  | User audit trail              |

**Relationships:**

- `supplier_id` → `supplier.id`
- One-to-many with `product_variant`
- One-to-many with `product_images`
- Many-to-many with `product_category` via `product_categories`

---

### product_variant

**Purpose:** Product SKU variations (size, color, flavor, etc.)

| Column                 | Type          | Key    | Description               |
| ---------------------- | ------------- | ------ | ------------------------- |
| id                     | char(36)      | PK     | UUID                      |
| product_id             | char(36)      | FK     | Parent product            |
| name                   | varchar(255)  |        | Variant display name      |
| sku                    | int           | UNIQUE | Auto-increment SKU number |
| barcode                | varchar(255)  | UNIQUE | Scannable barcode         |
| price                  | decimal(10,2) |        | Selling price             |
| purchased_cost         | decimal(10,2) |        | Cost basis                |
| low_stock_qty          | int           |        | Reorder point             |
| ideal_stock_qty        | int           |        | Target stock level        |
| available              | tinyint(1)    |        | Available for sale        |
| visible                | tinyint(1)    |        | Visible in POS            |
| is_composite           | tinyint(1)    |        | Assembled variant         |
| created_at, updated_at | datetime      |        | Timestamps                |
| deleted_at             | datetime      |        | Soft delete               |

**Relationships:**

- `product_id` → `product.id`
- One-to-many with `inventory` (multi-warehouse stock)
- Many-to-many with `product_option_value` via `product_variant_options`
- One-to-many with `product_variant_conversion` (unit conversions)

---

### product_images

**Purpose:** Product visual assets

| Column                 | Type     | Key | Description                 |
| ---------------------- | -------- | --- | --------------------------- |
| id                     | char(36) | PK  | UUID                        |
| product_id             | char(36) | FK  | Parent product              |
| product_variant_id     | char(36) | FK  | Specific variant (optional) |
| image_url              | text     |     | Image storage path/URL      |
| image_order            | int      |     | Display order (1=main)      |
| created_at, updated_at | datetime |     | Timestamps                  |

---

### product_category

**Purpose:** Hierarchical product taxonomy

| Column                 | Type         | Key | Description                 |
| ---------------------- | ------------ | --- | --------------------------- |
| id                     | char(36)     | PK  | UUID                        |
| parent_id              | char(36)     | FK  | Parent category (NULL=root) |
| title                  | varchar(255) |     | Category name               |
| sort_order             | int          |     | Display order               |
| image_url              | text         |     | Category image              |
| exclude_fee_delivery   | tinyint(1)   |     | Exclude from delivery fees  |
| mark_extra_fee         | tinyint(1)   |     | Apply extra charges         |
| created_at, updated_at | datetime     |     | Timestamps                  |
| deleted_at             | datetime     |     | Soft delete                 |

**Hierarchical Structure:** Self-referencing via `parent_id` for nested categories

---

### product_option & product_option_value

**Purpose:** Variant attribute system (Size: S/M/L, Color: Red/Blue)

**product_option:**

- `id`, `product_id`, `option_name` (e.g., "Size")

**product_option_value:**

- `id`, `option_id`, `value_name` (e.g., "Large")

**product_variant_options (junction):**

- Links `variant_id` ↔ `option_value_id`

---

### variant_composite

**Purpose:** Bill of materials for assembled products

| Column               | Type          | Key | Description                 |
| -------------------- | ------------- | --- | --------------------------- |
| variant_id           | char(36)      | FK  | Finished product variant    |
| component_variant_id | char(36)      | FK  | Component variant           |
| quantity             | decimal(10,2) |     | Quantity needed to assemble |

**Example:** "Large Combo Meal" requires 1x Burger + 1x Fries + 1x Drink

---

### product_variant_conversion

**Purpose:** Unit conversion rules (1 box = 24 bottles)

| Column            | Type          | Key | Description  |
| ----------------- | ------------- | --- | ------------ |
| id                | char(36)      | PK  | UUID         |
| variant_id        | char(36)      | FK  | Base variant |
| from_variant_id   | char(36)      | FK  | Source unit  |
| to_variant_id     | char(36)      | FK  | Target unit  |
| conversion_factor | decimal(10,2) |     | Multiplier   |

---

## 🏪 2. INVENTORY & WAREHOUSE

### warehouse

**Purpose:** Physical locations (stores, distribution centers)

| Column                  | Type         | Key | Description                           |
| ----------------------- | ------------ | --- | ------------------------------------- |
| id                      | char(36)     | PK  | UUID                                  |
| name                    | varchar(255) |     | Warehouse name                        |
| is_main                 | tinyint(1)   |     | Central distribution center           |
| owner_name              | varchar(255) |     | Manager name                          |
| address                 | text         |     | Physical address                      |
| phone                   | varchar(50)  |     | Contact number                        |
| lat, lng                | varchar(255) |     | GPS coordinates                       |
| walkin_radius_in_meters | int          |     | Geofence radius for walk-in customers |
| image                   | text         |     | Warehouse photo                       |
| is_deleted              | tinyint(1)   |     | Soft delete flag                      |
| created_at, updated_at  | datetime     |     | Timestamps                            |

**Walk-in Validation:** Customers must be within `walkin_radius_in_meters` of `lat,lng` coordinates

---

### warehouse_slot

**Purpose:** Storage locations within warehouses

| Column                 | Type          | Key | Description                                  |
| ---------------------- | ------------- | --- | -------------------------------------------- |
| id                     | char(36)      | PK  | UUID                                         |
| warehouse_id           | char(36)      | FK  | Parent warehouse                             |
| slot_name              | varchar(255)  |     | Location identifier (e.g., "Aisle 3, Bin B") |
| slot_capacity          | decimal(10,2) |     | Cubic meters capacity                        |
| status                 | enum          |     | ACTIVE, INACTIVE                             |
| pos_slot               | tinyint(1)    |     | Used for POS sales                           |
| for_replenishment      | tinyint(1)    |     | Used for stock transfers                     |
| created_at, updated_at | datetime      |     | Timestamps                                   |
| created_by, updated_by | char(36)      | FK  | Audit trail                                  |

---

### inventory

**Purpose:** Stock quantities per slot/variant/lot

| Column                 | Type     | Key | Description          |
| ---------------------- | -------- | --- | -------------------- |
| id                     | char(36) | PK  | UUID                 |
| slot_id                | char(36) | FK  | Storage location     |
| variant_id             | char(36) | FK  | Product variant      |
| lot_id                 | char(36) | FK  | Lot/batch (optional) |
| qty                    | int      |     | On-hand quantity     |
| expired_at             | date     |     | Expiration date      |
| created_at, updated_at | datetime |     | Timestamps           |

**Multi-warehouse Model:** Inventory tracked at slot level (warehouse → slot → inventory)

---

### inventory_transactions

**Purpose:** Complete audit log of all stock movements

| Column                 | Type     | Key | Description                  |
| ---------------------- | -------- | --- | ---------------------------- |
| id                     | char(36) | PK  | UUID                         |
| variant_id             | char(36) | FK  | Product variant              |
| slot_id                | char(36) | FK  | Storage location             |
| lot_id                 | char(36) | FK  | Lot/batch                    |
| qty                    | int      |     | Quantity moved (+ or -)      |
| transaction_type       | enum     |     | Movement type (see below)    |
| created_by             | char(36) | FK  | User who created transaction |
| created_at, updated_at | datetime |     | Timestamps                   |

**Transaction Types:**

- `STOCK_IN`, `STOCK_OUT` - Manual adjustments
- `SALE` - Customer order fulfillment
- `PURCHASE` - Supplier PO receipt
- `TRANSFER_IN`, `TRANSFER_OUT` - Inter-warehouse transfers
- `REPLENISHMENT` - Internal stock movements
- `COMPOSE_IN`, `COMPOSE_OUT` - Composite product assembly
- `CONVERSION_IN`, `CONVERSION_OUT` - Unit conversions
- `ADJUSTMENT_IN`, `ADJUSTMENT_OUT` - Manual corrections
- `DAMAGE` - Damaged/expired goods
- `RETURN` - Customer returns

---

### product_lot

**Purpose:** Batch tracking for perishables

| Column                 | Type          | Key | Description           |
| ---------------------- | ------------- | --- | --------------------- |
| id                     | char(36)      | PK  | UUID                  |
| variant_id             | char(36)      | FK  | Product variant       |
| lot_number             | varchar(255)  |     | Manufacturer lot code |
| manufacturing_date     | date          |     | Production date       |
| expiration_date        | date          |     | Expiration date       |
| cost_per_unit          | decimal(10,2) |     | FIFO cost basis       |
| created_at, updated_at | datetime      |     | Timestamps            |

---

## 🚚 3. REPLENISHMENT & TRANSFERS

### replenishment

**Purpose:** Inter-warehouse stock transfer orders

| Column                 | Type     | Key | Description                                   |
| ---------------------- | -------- | --- | --------------------------------------------- |
| replenish_id           | char(36) | PK  | UUID                                          |
| from_warehouse         | char(36) | FK  | Source warehouse                              |
| to_warehouse           | char(36) | FK  | Destination warehouse                         |
| status                 | enum     |     | draft, approved, receiving, received, deleted |
| approved_at            | datetime |     | Approval timestamp                            |
| approved_by            | char(36) | FK  | Approver                                      |
| receiving_at           | datetime |     | Start receiving                               |
| receiving_by           | char(36) | FK  | Receiver                                      |
| received_at            | datetime |     | Completed timestamp                           |
| received_by            | char(36) | FK  | Receiver                                      |
| created_at, updated_at | datetime |     | Timestamps                                    |
| deleted_at             | datetime |     | Soft delete                                   |

**Workflow:** DRAFT → APPROVED → RECEIVING → RECEIVED

---

### replenishment_items

**Purpose:** Line items in transfer orders

| Column                 | Type          | Key | Description                       |
| ---------------------- | ------------- | --- | --------------------------------- |
| replenish_items_id     | char(36)      | PK  | UUID                              |
| replenish_id           | char(36)      | FK  | Parent replenishment              |
| product_variant_id     | char(36)      | FK  | Variant being transferred         |
| sent_qty               | int           |     | Quantity shipped                  |
| received_qty           | int           |     | Quantity received                 |
| fulfilled_qty          | int           |     | Quantity fulfilled to destination |
| cost                   | decimal(10,2) |     | Transfer cost per unit            |
| created_at, updated_at | datetime      |     | Timestamps                        |

---

### replenishment_picking_list

**Purpose:** Specify which slots to pick from

| Column           | Type     | Key | Description      |
| ---------------- | -------- | --- | ---------------- |
| replenishment_id | char(36) | PK  | Transfer order   |
| variant_id       | char(36) | PK  | Product variant  |
| slot_id          | char(36) | PK  | Source slot      |
| qty              | int      |     | Quantity to pick |

**Composite PK:** `(replenishment_id, variant_id, slot_id)`

---

### backlog_orders

**Purpose:** Orders waiting for stock (prevents overselling)

| Column                 | Type     | Key | Description         |
| ---------------------- | -------- | --- | ------------------- |
| id                     | char(50) | PK  |                     |
| slot_id                | char(36) | FK  | Destination slot    |
| variant_id             | char(36) | FK  | Product variant     |
| qty                    | int      |     | Quantity on backlog |
| created_at, updated_at | datetime |     | Timestamps          |
| created_by             | char(36) | FK  | User who created    |

**Purpose:** Allows sales even when stock is negative, creates fulfillment queue

---

## 🛒 4. CUSTOMER ORDERS

### customer

**Purpose:** Customer master data

| Column                 | Type          | Key    | Description          |
| ---------------------- | ------------- | ------ | -------------------- |
| id                     | char(50)      | PK     | Customer ID          |
| customer_name          | varchar(255)  |        | Full name            |
| phone                  | varchar(50)   | UNIQUE | Contact number       |
| address                | text          |        | Delivery address     |
| customer_type          | enum          |        | general, delivery    |
| pos_warehouse_id       | char(36)      | FK     | Preferred warehouse  |
| extra_price            | decimal(10,2) |        | Premium pricing tier |
| is_active              | tinyint(1)    |        | Active status        |
| created_at, updated_at | datetime      |        | Timestamps           |
| created_by             | char(36)      | FK     | Created by user      |

---

### customer_token

**Purpose:** Customer app authentication

| Column      | Type     | Key | Description        |
| ----------- | -------- | --- | ------------------ |
| id          | int      | PK  | Auto-increment     |
| customer_id | char(50) | FK  | Customer reference |
| token       | text     |     | JWT or auth token  |
| expire_at   | datetime |     | Token expiration   |
| created_at  | datetime |     | Created timestamp  |

**Cleanup:** Cron job removes expired tokens hourly

---

### customer_order

**Purpose:** Sales orders (dine-in, takeaway, delivery, cinema tickets)

| Column                   | Type          | Key | Description                                               |
| ------------------------ | ------------- | --- | --------------------------------------------------------- |
| order_id                 | char(50)      | PK  | Order identifier                                          |
| customer_id              | char(50)      | FK  | Customer reference                                        |
| warehouse_id             | char(36)      | FK  | Fulfilling warehouse                                      |
| status                   | enum          |     | DRAFT, APPROVED, PROCESSING, COMPLETED, CANCELLED, REFUND |
| table_number             | varchar(50)   |     | Restaurant table                                          |
| served_type              | enum          |     | dine_in, take_away, food_delivery                         |
| delivery_address         | text          |     | Delivery location                                         |
| address_lat, address_lng | varchar(255)  |     | GPS coordinates                                           |
| delivery_code            | varchar(50)   |     | Verification code                                         |
| total_amount             | decimal(12,2) |     | Order total                                               |
| invoice_no               | varchar(255)  |     | Invoice number                                            |
| created_at               | datetime      |     | Order placed                                              |
| paid_at                  | datetime      |     | Payment completed                                         |
| refund_at                | datetime      |     | Refund processed                                          |
| transfer_at              | datetime      |     | Transferred timestamp                                     |
| created_by, updated_by   | char(36)      | FK  | Audit trail                                               |

**Status Flow:** DRAFT → APPROVED → PROCESSING → COMPLETED

---

### customer_order_detail

**Purpose:** Order line items

| Column          | Type          | Key | Description        |
| --------------- | ------------- | --- | ------------------ |
| order_detail_id | char(50)      | PK  | Line item ID       |
| order_id        | char(50)      | FK  | Parent order       |
| variant_id      | char(36)      | FK  | Product variant    |
| qty             | int           |     | Quantity ordered   |
| fulfilled_qty   | int           |     | Quantity fulfilled |
| price           | decimal(10,2) |     | Unit price         |
| discount_amount | decimal(10,2) |     | Line item discount |
| modifier_amount | decimal(10,2) |     | Add-ons total      |
| total_amount    | decimal(12,2) |     | Line total         |

**Formula:** `total_amount = (price × qty) - discount_amount + modifier_amount`

**Relationships:**

- One-to-many with `order_detail_modifier` (add-ons)
- One-to-many with `discount_log` (applied discounts)
- One-to-one with `seat_reservation` (cinema tickets)

---

### order_detail_modifier

**Purpose:** Add-ons and customizations (extra cheese, no pickles)

| Column           | Type          | Key | Description          |
| ---------------- | ------------- | --- | -------------------- |
| order_detail_id  | char(50)      | PK  | Parent line item     |
| modifier_item_id | char(36)      | PK  | Modifier option      |
| price            | decimal(10,2) |     | Additional charge    |
| notes            | text          |     | Special instructions |
| created_at       | datetime      |     | Timestamp            |
| created_by       | char(36)      | FK  | User                 |

**Composite PK:** `(order_detail_id, modifier_item_id)`

---

### order_item_status

**Purpose:** Kitchen display system status tracking

| Column                 | Type     | Key | Description                                  |
| ---------------------- | -------- | --- | -------------------------------------------- |
| id                     | char(50) | PK  | Status ID                                    |
| order_detail_id        | char(50) | FK  | Line item                                    |
| status                 | enum     |     | pending, preparing, ready, served, cancelled |
| created_at, updated_at | datetime |     | Timestamps                                   |
| created_by, updated_by | char(36) | FK  | Staff                                        |

---

### order_status_log

**Purpose:** Order lifecycle audit trail

| Column     | Type        | Key | Description             |
| ---------- | ----------- | --- | ----------------------- |
| id         | int         | PK  | Auto-increment          |
| order_id   | char(50)    | FK  | Order reference         |
| status     | varchar(50) |     | New status              |
| created_at | datetime    |     | Timestamp               |
| created_by | char(36)    | FK  | User who changed status |

---

### order_return

**Purpose:** Return/refund processing

| Column        | Type          | Key | Description         |
| ------------- | ------------- | --- | ------------------- |
| id            | char(50)      | PK  | Return ID           |
| order_id      | char(50)      | FK  | Original order      |
| return_amount | decimal(12,2) |     | Refund amount       |
| reason        | text          |     | Return reason       |
| created_at    | datetime      |     | Return date         |
| created_by    | char(36)      | FK  | Staff who processed |

---

## 💳 5. PAYMENTS & DISCOUNTS

### order_payment

**Purpose:** Order payment tracking (supports partial/split payments)

| Column                 | Type          | Key | Description             |
| ---------------------- | ------------- | --- | ----------------------- |
| payment_id             | char(50)      | PK  | Payment ID              |
| order_id               | char(50)      | FK  | Order reference         |
| shift_id               | char(50)      | FK  | Cashier shift           |
| method_id              | char(50)      | FK  | Payment method          |
| currency               | enum          |     | USD, KHR                |
| exchange_rate          | decimal(10,4) |     | KHR/USD rate            |
| amount_usd             | decimal(12,2) |     | Normalized to USD       |
| amount_used            | decimal(12,2) |     | Amount applied to order |
| created_at, updated_at | datetime      |     | Timestamps              |
| deleted_at             | datetime      |     | Soft delete             |

**Multi-Payment:** Multiple payment records per order for split payments

---

### payment_method

**Purpose:** Payment method types

| Column     | Type         | Key | Description                             |
| ---------- | ------------ | --- | --------------------------------------- |
| method_id  | char(50)     | PK  | Method ID                               |
| method     | varchar(100) |     | cash, card, wallet, bank_transfer, etc. |
| deleted_at | datetime     |     | Soft delete                             |

---

### discount

**Purpose:** Discount definitions

| Column                 | Type          | Key | Description                   |
| ---------------------- | ------------- | --- | ----------------------------- |
| discount_id            | char(50)      | PK  | Discount ID                   |
| warehouse_id           | char(36)      | FK  | Warehouse scope (NULL=global) |
| title                  | varchar(255)  |     | Display name                  |
| description            | text          |     | Discount details              |
| type                   | enum          |     | AMOUNT, PERCENTAGE            |
| value                  | decimal(10,2) |     | Discount value                |
| created_at, update_at  | datetime      |     | Timestamps                    |
| deleted_at             | datetime      |     | Soft delete                   |
| created_by, updated_by | char(36)      | FK  | Audit trail                   |

---

### discount_log

**Purpose:** Track applied discounts to orders

| Column             | Type          | Key | Description            |
| ------------------ | ------------- | --- | ---------------------- |
| id                 | char(50)      | PK  | Log ID                 |
| discount_id        | char(50)      | FK  | Discount reference     |
| order_detail_id    | char(50)      | FK  | Line item              |
| discount_amount    | decimal(12,2) |     | Applied amount         |
| discount_title     | varchar(255)  |     | Discount name snapshot |
| discount_type      | enum          |     | AMOUNT, PERCENTAGE     |
| value              | decimal(10,2) |     | Value snapshot         |
| is_manual_discount | tinyint(1)    |     | Manual override        |
| created_at         | datetime      |     | Applied timestamp      |
| created_by         | char(36)      | FK  | User                   |

---

### product_discount

**Purpose:** Define which products eligible for discount

| Column         | Type       | Key | Description           |
| -------------- | ---------- | --- | --------------------- |
| id             | int        | PK  | Auto-increment        |
| discount_id    | char(50)   | FK  | Discount reference    |
| is_applied_all | tinyint(1) |     | Apply to all products |
| product_id     | char(36)   | FK  | Specific product      |
| category_id    | char(36)   | FK  | Product category      |

---

## 🎬 6. CINEMA/THEATER MODULE

### movie

**Purpose:** Movie master data

| Column                 | Type         | Key | Description                     |
| ---------------------- | ------------ | --- | ------------------------------- |
| movie_id               | char(36)     | PK  | UUID (same as variant_id)       |
| duration_minutes       | int          |     | Runtime                         |
| rating                 | enum         |     | G, PG, PG-13, R, NC-17          |
| genre                  | json         |     | Genre tags ["Action", "Comedy"] |
| release_date           | date         |     | Release date                    |
| director               | varchar(255) |     | Director name                   |
| cast                   | json         |     | Actor list                      |
| synopsis               | text         |     | Plot summary                    |
| poster_url             | text         |     | Poster image URL                |
| trailer_url            | text         |     | Trailer video URL               |
| email_producer         | json         |     | Email list for reports          |
| created_at, updated_at | datetime     |     | Timestamps                      |
| deleted_at             | datetime     |     | Soft delete                     |

**Integration:** `movie_id` = `product_variant.id` (movies are products)

---

### cinema_hall

**Purpose:** Theater hall configuration

| Column                 | Type         | Key | Description                   |
| ---------------------- | ------------ | --- | ----------------------------- |
| hall_id                | char(36)     | PK  | UUID                          |
| warehouse_id           | char(36)     | FK  | Theater location              |
| hall_name              | varchar(255) |     | Hall name                     |
| hall_number            | int          |     | Hall number                   |
| rows                   | int          |     | Number of rows                |
| columns                | int          |     | Seats per row                 |
| total_seats            | int          |     | Total capacity                |
| status                 | enum         |     | active, maintenance, inactive |
| hall_features          | json         |     | Features (IMAX, 3D, Dolby)    |
| parts                  | json         |     | Seat layout zones             |
| created_at, updated_at | datetime     |     | Timestamps                    |
| created_by             | char(36)     | FK  | Created by                    |
| deleted_at             | datetime     |     | Soft delete                   |

---

### cinema_seat

**Purpose:** Individual theater seats

| Column                 | Type        | Key | Description                                |
| ---------------------- | ----------- | --- | ------------------------------------------ |
| seat_id                | char(36)    | PK  | UUID                                       |
| hall_id                | char(36)    | FK  | Parent hall                                |
| row_label              | varchar(10) |     | Row identifier (A, B, C)                   |
| seat_number            | int         |     | Seat number in row                         |
| seat_type              | enum        |     | standard, vip, couple, wheelchair, blocked |
| is_available           | tinyint(1)  |     | Purchasable status                         |
| group_id               | char(36)    |     | Couple seat grouping                       |
| created_at, updated_at | datetime    |     | Timestamps                                 |
| deleted_at             | datetime    |     | Soft delete                                |

**Couple Seats:** Linked via `group_id`, sold together

---

### showtime

**Purpose:** Movie screening schedules

| Column                 | Type          | Key | Description                                             |
| ---------------------- | ------------- | --- | ------------------------------------------------------- |
| showtime_id            | char(36)      | PK  | UUID                                                    |
| hall_id                | char(36)      | FK  | Theater hall                                            |
| movie_id               | char(36)      | FK  | Movie being shown                                       |
| pricing_template_id    | char(36)      | FK  | Pricing rules                                           |
| show_date              | date          |     | Screening date                                          |
| start_time             | time          |     | Start time                                              |
| end_time               | time          |     | End time                                                |
| status                 | enum          |     | scheduled, selling, sold_out, started, ended, cancelled |
| available_seats        | int           |     | Seats remaining                                         |
| total_seats_allocated  | int           |     | Total seats                                             |
| base_price             | decimal(12,2) |     | Ticket base price                                       |
| created_at, updated_at | datetime      |     | Timestamps                                              |
| deleted_at             | datetime      |     | Soft delete                                             |

**Status Flow:** scheduled → selling → sold_out → started → ended

---

### seat_reservation

**Purpose:** Ticket purchases

| Column                 | Type          | Key | Description                                      |
| ---------------------- | ------------- | --- | ------------------------------------------------ |
| reservation_id         | char(36)      | PK  | UUID                                             |
| showtime_id            | char(36)      | FK  | Screening                                        |
| seat_id                | char(36)      | FK  | Reserved seat                                    |
| order_detail_id        | char(50)      | FK  | Order line item                                  |
| status                 | enum          |     | pending, confirmed, admitted, cancelled, expired |
| price                  | decimal(12,2) |     | Ticket price (seat type premium)                 |
| code                   | varchar(50)   |     | QR/barcode for admission                         |
| confirmed_at           | datetime      |     | Confirmation time                                |
| confirmed_by           | char(36)      | FK  | Staff                                            |
| admitted_at            | datetime      |     | Check-in time                                    |
| admitted_by            | char(36)      | FK  | Usher                                            |
| created_at, updated_at | datetime      |     | Timestamps                                       |

**Workflow:** pending → confirmed → admitted

---

### pricing_template

**Purpose:** Dynamic ticket pricing rules

| Column                 | Type         | Key | Description                           |
| ---------------------- | ------------ | --- | ------------------------------------- |
| template_id            | char(36)     | PK  | UUID                                  |
| warehouse_id           | char(36)     | FK  | Theater                               |
| title                  | varchar(255) |     | Template name                         |
| time_slot              | enum         |     | matinee, evening, late_night, all_day |
| day_type               | enum         |     | weekday, weekend, holiday, all_days   |
| extra_seat_prices      | json         |     | Premium pricing by seat type          |
| created_at, updated_at | datetime     |     | Timestamps                            |
| deleted_at             | datetime     |     | Soft delete                           |

**Example JSON:**

```json
{
  "vip": 2.5,
  "couple": 5.0,
  "wheelchair": 0.0
}
```

---

## 📦 7. SUPPLIER & PURCHASING

### supplier

**Purpose:** Vendor master data

| Column                 | Type         | Key | Description       |
| ---------------------- | ------------ | --- | ----------------- |
| id                     | char(36)     | PK  | UUID              |
| name                   | varchar(255) |     | Supplier name     |
| contact_name           | varchar(255) |     | Contact person    |
| contact_phone          | varchar(50)  |     | Phone number      |
| contact_email          | varchar(255) |     | Email             |
| address                | text         |     | Physical address  |
| note                   | text         |     | Notes             |
| is_consignment         | tinyint(1)   |     | Consignment model |
| delete_date            | datetime     |     | Soft delete       |
| created_at, updated_at | datetime     |     | Timestamps        |
| created_by, updated_by | char(36)     | FK  | Audit trail       |

---

### supplier_purchase_order

**Purpose:** Purchase orders to suppliers

| Column                 | Type          | Key | Description                                                     |
| ---------------------- | ------------- | --- | --------------------------------------------------------------- |
| id                     | char(36)      | PK  | UUID                                                            |
| supplier_id            | char(36)      | FK  | Supplier reference                                              |
| warehouse_id           | char(36)      | FK  | Receiving warehouse                                             |
| po_increment           | int           |     | PO number sequence                                              |
| status                 | enum          |     | pending, partially, draft, approved, completed, deleted, closed |
| total                  | decimal(12,2) |     | PO total cost                                                   |
| purchased_at           | datetime      |     | Purchase date                                                   |
| expected_at            | datetime      |     | Expected delivery                                               |
| note                   | text          |     | PO notes                                                        |
| created_at, updated_at | datetime      |     | Timestamps                                                      |
| created_by             | char(36)      | FK  | Purchaser                                                       |

**Status Flow:** draft → approved → partially → completed

---

### supplier_purchase_order_detail

**Purpose:** PO line items

| Column                     | Type          | Key | Description                  |
| -------------------------- | ------------- | --- | ---------------------------- |
| id                         | char(36)      | PK  | UUID                         |
| supplier_purchase_order_id | char(36)      | FK  | Parent PO                    |
| product_variant_id         | char(36)      | FK  | Variant being purchased      |
| quantity                   | int           |     | Ordered quantity             |
| purchased_cost             | decimal(10,2) |     | Cost per unit                |
| status                     | enum          |     | pending, received, cancelled |
| received_qty               | int           |     | Received quantity            |
| created_at, updated_at     | datetime      |     | Timestamps                   |

---

### supplier_product_prices

**Purpose:** Supplier price lists with scheduling

| Column                 | Type               | Key | Description                        |
| ---------------------- | ------------------ | --- | ---------------------------------- |
| id                     | char(36)           | PK  | UUID                               |
| supplier_id            | char(36)           | FK  | Supplier                           |
| product_variant_id     | char(36)           | FK  | Variant                            |
| price                  | decimal(10,2)      |     | Current price                      |
| scheduled_price        | decimal(10,2)      |     | Upcoming price                     |
| scheduled_at           | datetime           |     | Schedule timestamp                 |
| scheduled_by           | char(36)           | FK  | Scheduler                          |
| effect_date            | date               |     | Effective date for scheduled price |
| created_at, updated_at | datetime           |     | Timestamps                         |
| created_by, updated_by | char(36)           | FK  | Audit trail                        |
| deleted_at, deleted_by | datetime, char(36) |     | Soft delete                        |

**Price Scheduling:** Cron job applies `scheduled_price` to `price` on `effect_date`

---

### supplier_po_addition_cost

**Purpose:** Additional PO costs (shipping, customs)

| Column                 | Type          | Key | Description                   |
| ---------------------- | ------------- | --- | ----------------------------- |
| id                     | char(50)      | PK  |                               |
| supplier_po_id         | char(36)      | FK  | Parent PO                     |
| name                   | varchar(255)  |     | Cost type (Shipping, Customs) |
| cost                   | decimal(12,2) |     | Additional cost               |
| status                 | enum          |     | pending, received, cancelled  |
| created_at, updated_at | datetime      |     | Timestamps                    |

---

### receive_po & receive_po_detail

**Purpose:** PO receiving transactions

**receive_po:**

- `id`, `supplier_po_id`, `warehouse_id`, `received_qty`, `received_at`

**receive_po_detail:**

- `id`, `receive_po_id`, `variant_id`, `qty`, `cost`

---

## 👥 8. USER MANAGEMENT & SECURITY

### user

**Purpose:** Staff and admin accounts

| Column          | Type         | Key    | Description        |
| --------------- | ------------ | ------ | ------------------ |
| id              | char(36)     | PK     | UUID               |
| username        | varchar(100) | UNIQUE | Login username     |
| phone_number    | varchar(50)  | UNIQUE | Contact phone      |
| password        | varchar(255) |        | Hashed password    |
| token           | text         |        | Session token      |
| fullname        | varchar(255) |        | Display name       |
| profile         | text         |        | Profile photo URL  |
| role_id         | char(36)     | FK     | User role          |
| warehouse_id    | char(36)     | FK     | Assigned warehouse |
| is_system_admin | tinyint(1)   |        | Super admin flag   |
| is_dev          | tinyint(1)   |        | Developer access   |
| is_deleted      | tinyint(1)   |        | Soft delete        |
| created_at      | datetime     |        | Registration date  |
| created_by      | char(36)     | FK     | Creator            |

---

### user_role

**Purpose:** Role-based access control

| Column      | Type         | Key    | Description                         |
| ----------- | ------------ | ------ | ----------------------------------- |
| id          | char(36)     | PK     | UUID                                |
| role        | varchar(100) | UNIQUE | Role name (OWNER, MANAGER, CASHIER) |
| permissions | json         |        | Resource → actions mapping          |
| is_default  | tinyint(1)   |        | Default role for new users          |
| created_at  | datetime     |        | Created timestamp                   |

**Permissions JSON Structure:**

```json
{
  "product": ["create", "read", "update", "delete"],
  "order": ["create", "read"],
  "reports": ["read"]
}
```

---

### user_activity_logs

**Purpose:** Audit trail of user actions

| Column     | Type         | Key | Description                          |
| ---------- | ------------ | --- | ------------------------------------ |
| log_id     | char(36)     | PK  | UUID                                 |
| user_id    | char(36)     | FK  | User performing action               |
| action     | varchar(100) |     | Action type (CREATE, UPDATE, DELETE) |
| table_name | varchar(100) |     | Affected table                       |
| key        | varchar(255) |     | Activity group identifier            |
| content    | json         |     | Before/after values                  |
| timestamp  | datetime     |     | Action timestamp                     |

---

## 💰 9. SHIFT MANAGEMENT

### shift

**Purpose:** Cashier shift cash management

| Column          | Type          | Key | Description          |
| --------------- | ------------- | --- | -------------------- |
| shift_id        | char(50)      | PK  | Shift ID             |
| opened_at       | datetime      |     | Shift start          |
| closed_at       | datetime      |     | Shift end            |
| opened_by       | char(36)      | FK  | Staff who opened     |
| closed_by       | char(36)      | FK  | Staff who closed     |
| opened_cash_usd | decimal(12,2) |     | Starting cash USD    |
| closed_cash_usd | decimal(12,2) |     | Expected cash USD    |
| actual_cash_usd | decimal(12,2) |     | Counted cash USD     |
| opened_cash_khr | decimal(12,2) |     | Starting cash KHR    |
| closed_cash_khr | decimal(12,2) |     | Expected cash KHR    |
| actual_cash_khr | decimal(12,2) |     | Counted cash KHR     |
| exchange_rate   | decimal(10,4) |     | KHR/USD rate         |
| status          | enum          |     | OPEN, CLOSE          |
| receipt         | json          |     | Shift summary report |
| updated_at      | datetime      |     | Last modified        |

**Cash Reconciliation:** Compare `closed_cash_*` vs `actual_cash_*` for variances

---

## ⚙️ 10. SYSTEM CONFIGURATION

### setting

**Purpose:** Application configuration key-value store

| Column    | Type         | Key | Description                   |
| --------- | ------------ | --- | ----------------------------- |
| id        | int          | PK  | Auto-increment                |
| option    | varchar(255) |     | Setting key                   |
| value     | text         |     | Setting value                 |
| warehouse | char(36)     | FK  | Warehouse scope (NULL=global) |

**Common Settings:**

- `TIMEZONE` - Application timezone
- `DEFAULT_CURRENCY` - USD or KHR
- `EXCHANGE_RATE` - Current KHR/USD rate
- `CINEMA_REPORT_RECIPIENTS` - Email list

---

### cron_log

**Purpose:** Scheduled job execution logs

| Column        | Type         | Key | Description                        |
| ------------- | ------------ | --- | ---------------------------------- |
| id            | int          | PK  | Auto-increment                     |
| job_name      | varchar(255) |     | Job identifier                     |
| started_at    | datetime     |     | Start time                         |
| finished_at   | datetime     |     | End time                           |
| duration_ms   | int          |     | Execution time (ms)                |
| status        | enum         |     | success, failed, skipped, retrying |
| error_message | text         |     | Error description                  |
| error_stack   | text         |     | Stack trace                        |
| retry_count   | int          |     | Retry attempts                     |
| metadata      | json         |     | Job-specific data                  |

**Common Jobs:**

- `DAILY_CINEMA_REPORT` - Email ticket sales
- `APPLY_SCHEDULED_PRICES` - Update supplier prices
- `CLEAN_EXPIRED_TOKENS` - Remove old customer tokens

---

### variables

**Purpose:** Dynamic system variables

| Column                 | Type         | Key | Description    |
| ---------------------- | ------------ | --- | -------------- |
| id                     | int          | PK  | Auto-increment |
| name                   | varchar(255) |     | Variable name  |
| value                  | text         |     | Variable value |
| created_at, updated_at | datetime     |     | Timestamps     |

---

## 🖨️ 11. PRINTING & KITCHEN

### print_queue

**Purpose:** Print job queue

| Column       | Type     | Key | Description           |
| ------------ | -------- | --- | --------------------- |
| id           | int      | PK  | Auto-increment        |
| order_id     | char(50) | FK  | Order reference       |
| content      | json     |     | Print data            |
| printer_info | json     |     | Printer configuration |
| printed_at   | datetime |     | Completion time       |
| created_at   | datetime |     | Queued time           |

---

### print_kitchen_log

**Purpose:** Kitchen display system print tracking

| Column          | Type     | Key | Description      |
| --------------- | -------- | --- | ---------------- |
| id              | int      | PK  | Auto-increment   |
| order_id        | char(50) | FK  | Order            |
| order_detail_id | char(50) | FK  | Line item        |
| warehouse_id    | char(36) | FK  | Kitchen location |
| content         | json     |     | Print content    |
| printer_info    | json     |     | Printer details  |
| printed_at      | datetime |     | Print time       |
| created_at      | datetime |     | Created time     |

---

### warehouse_category_printer

**Purpose:** Route categories to specific printers

| Column                 | Type         | Key | Description        |
| ---------------------- | ------------ | --- | ------------------ |
| warehouse_id           | char(36)     | PK  | Warehouse          |
| category_id            | char(36)     | PK  | Product category   |
| printer_name           | varchar(255) |     | Printer identifier |
| created_at, updated_at | datetime     |     | Timestamps         |

**Composite PK:** `(warehouse_id, category_id)`

**Example:** "Pizza" category → Kitchen Printer 1, "Drinks" → Bar Printer

---

## 🍽️ 12. RESTAURANT OPERATIONS

### restaurant_tables

**Purpose:** Dining table management

| Column                 | Type        | Key | Description                                |
| ---------------------- | ----------- | --- | ------------------------------------------ |
| id                     | char(36)    | PK  | UUID                                       |
| warehouse_id           | char(36)    | FK  | Restaurant location                        |
| table_number           | varchar(50) |     | Table identifier                           |
| capacity               | int         |     | Seating capacity                           |
| status                 | enum        |     | available, occupied, reserved, maintenance |
| created_at, updated_at | datetime    |     | Timestamps                                 |
| deleted_at             | datetime    |     | Soft delete                                |

---

### modifier & modifier_items

**Purpose:** Menu item customizations (add-ons, replacements)

**modifier:**
| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | char(36) | PK | UUID |
| title | varchar(255) | | Modifier group name |
| description | text | | Description |
| created_at, updated_at | datetime | | Timestamps |

**modifier_items:**
| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | char(36) | PK | UUID |
| modifier_id | char(36) | FK | Parent modifier |
| title | varchar(255) | | Item name (e.g., "Extra Cheese") |
| price | decimal(10,2) | | Additional cost |
| created_at, updated_at | datetime | | Timestamps |

**product_modifier (junction):**

- Links `product_id` ↔ `modifier_id`

---

### tasks

**Purpose:** Staff task management

| Column                 | Type         | Key | Description                                |
| ---------------------- | ------------ | --- | ------------------------------------------ |
| id                     | char(36)     | PK  | UUID                                       |
| warehouse_id           | char(36)     | FK  | Location                                   |
| assigned_to            | char(36)     | FK  | Staff user                                 |
| task_type              | varchar(100) |     | Task category                              |
| description            | text         |     | Task details                               |
| status                 | enum         |     | pending, in_progress, completed, cancelled |
| due_at                 | datetime     |     | Deadline                                   |
| completed_at           | datetime     |     | Completion time                            |
| created_at, updated_at | datetime     |     | Timestamps                                 |

---

## 📊 13. REPORTING & ANALYTICS

### banners

**Purpose:** Promotional banners in app/web

| Column                 | Type         | Key | Description       |
| ---------------------- | ------------ | --- | ----------------- |
| id                     | int          | PK  | Auto-increment    |
| title                  | varchar(255) |     | Banner title      |
| image_url              | text         |     | Image path        |
| link_url               | text         |     | Click destination |
| sort_order             | int          |     | Display order     |
| is_active              | tinyint(1)   |     | Active status     |
| created_at, updated_at | datetime     |     | Timestamps        |

---

### seeds_log

**Purpose:** Track database seeding operations

| Column      | Type         | Key | Description      |
| ----------- | ------------ | --- | ---------------- |
| id          | int          | PK  | Auto-increment   |
| seed_name   | varchar(255) |     | Seed script name |
| executed_at | datetime     |     | Execution time   |

---

### return_stock_in_transaction

**Purpose:** Track inventory returns to stock

| Column     | Type     | Key | Description       |
| ---------- | -------- | --- | ----------------- |
| id         | char(36) | PK  | UUID              |
| order_id   | char(50) | FK  | Original order    |
| variant_id | char(36) | FK  | Product variant   |
| slot_id    | char(36) | FK  | Return location   |
| qty        | int      |     | Quantity returned |
| reason     | text     |     | Return reason     |
| created_at | datetime |     | Return date       |
| created_by | char(36) | FK  | Staff             |

---

## 🔗 Entity Relationships

### Primary Relationships

```mermaid
graph LR
    Product --> ProductVariant
    ProductVariant --> Inventory
    Inventory --> WarehouseSlot
    WarehouseSlot --> Warehouse

    Customer --> CustomerOrder
    CustomerOrder --> CustomerOrderDetail
    CustomerOrderDetail --> ProductVariant

    Movie --> Showtime
    Showtime --> CinemaHall
    Showtime --> SeatReservation
    SeatReservation --> CinemaSeat
    SeatReservation --> CustomerOrderDetail

    Supplier --> SupplierPurchaseOrder
    SupplierPurchaseOrder --> SupplierPurchaseOrderDetail
    SupplierPurchaseOrderDetail --> ProductVariant
```

### Common Foreign Key Patterns

| Column Pattern | References                | Description             |
| -------------- | ------------------------- | ----------------------- |
| `warehouse_id` | `warehouse.id`            | Multi-warehouse scoping |
| `product_id`   | `product.id`              | Product reference       |
| `variant_id`   | `product_variant.id`      | Variant reference       |
| `customer_id`  | `customer.id`             | Customer reference      |
| `order_id`     | `customer_order.order_id` | Order reference         |
| `user_id`      | `user.id`                 | User reference          |
| `created_by`   | `user.id`                 | Audit: creator          |
| `updated_by`   | `user.id`                 | Audit: last modifier    |
| `deleted_by`   | `user.id`                 | Audit: deleter          |

---

## 📝 Common Query Patterns

### Get Product Inventory Across Warehouses

```sql
SELECT
  p.title AS product,
  pv.name AS variant,
  w.name AS warehouse,
  ws.slot_name,
  i.qty,
  i.expired_at
FROM inventory i
JOIN warehouse_slot ws ON i.slot_id = ws.id
JOIN warehouse w ON ws.warehouse_id = w.id
JOIN product_variant pv ON i.variant_id = pv.id
JOIN product p ON pv.product_id = p.id
WHERE p.deleted_at IS NULL
  AND pv.deleted_at IS NULL
  AND i.qty > 0
ORDER BY p.title, pv.name, w.name;
```

### Get Order Details with Customer Info

```sql
SELECT
  co.order_id,
  co.created_at,
  c.customer_name,
  co.status,
  co.served_type,
  co.total_amount,
  w.name AS warehouse
FROM customer_order co
JOIN customer c ON co.customer_id = c.id
JOIN warehouse w ON co.warehouse_id = w.id
WHERE co.created_at >= '2026-03-01'
ORDER BY co.created_at DESC;
```

### Get Cinema Showtime Availability

```sql
SELECT
  m.title AS movie,
  s.show_date,
  s.start_time,
  ch.hall_name,
  s.available_seats,
  s.total_seats_allocated,
  s.status
FROM showtime s
JOIN movie m ON s.movie_id = m.movie_id
JOIN cinema_hall ch ON s.hall_id = ch.hall_id
WHERE s.show_date >= CURDATE()
  AND s.status IN ('scheduled', 'selling')
  AND s.deleted_at IS NULL
ORDER BY s.show_date, s.start_time;
```

### Get Low Stock Products

```sql
SELECT
  p.title,
  pv.name,
  pv.sku,
  SUM(i.qty) AS total_qty,
  pv.low_stock_qty,
  pv.ideal_stock_qty
FROM product_variant pv
JOIN product p ON pv.product_id = p.id
LEFT JOIN inventory i ON pv.id = i.variant_id
WHERE pv.deleted_at IS NULL
  AND p.track_stock = 1
GROUP BY pv.id
HAVING total_qty < pv.low_stock_qty
ORDER BY total_qty ASC;
```

### Get Daily Sales Summary by Warehouse

```sql
SELECT
  w.name AS warehouse,
  DATE(co.created_at) AS sale_date,
  COUNT(co.order_id) AS total_orders,
  SUM(co.total_amount) AS total_sales,
  AVG(co.total_amount) AS avg_order_value
FROM customer_order co
JOIN warehouse w ON co.warehouse_id = w.id
WHERE co.status = 'COMPLETED'
  AND co.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY w.id, DATE(co.created_at)
ORDER BY sale_date DESC, total_sales DESC;
```

### Get Inventory Transactions by Type

```sql
SELECT
  transaction_type,
  COUNT(*) AS transaction_count,
  SUM(qty) AS total_qty_moved,
  MIN(created_at) AS first_transaction,
  MAX(created_at) AS last_transaction
FROM inventory_transactions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY transaction_type
ORDER BY transaction_count DESC;
```

---

## 🎯 Key Features & Capabilities

### Multi-Warehouse Management

- Inventory tracked at slot level within warehouses
- Inter-warehouse transfers via replenishment system
- Warehouse-specific pricing and settings
- Geolocation validation for walk-in customers

### Cinema Operations

- Complete theater management (halls, seats, showtimes)
- Dynamic pricing templates (time/day-based)
- Seat type premiums (VIP, couple seats)
- QR/barcode admission tracking
- Automated daily sales reports

### Inventory Control

- FIFO lot/batch tracking
- 18 transaction types for complete audit trail
- Composite product assembly (BOM)
- Unit conversion system
- Stock counting and adjustments
- Backlog orders (sell before stock)

### Order Management

- Multiple fulfillment types (dine-in, takeaway, delivery)
- Split/partial payments
- Dual currency (USD/KHR)
- Kitchen display integration
- Order status workflow
- Returns and refunds

### Role-Based Access

- JSON-based permission system
- Resource-level action controls
- Warehouse assignment
- Activity logging
- OWNER role bypass

### Supplier Management

- Purchase orders with approval workflow
- Scheduled price updates (cron)
- Additional costs (shipping, customs)
- Consignment model support
- Price history tracking

---

## 🔐 Security & Audit

### Audit Trail Components

1. **Timestamp Tracking**
   - `created_at`, `updated_at`, `deleted_at`

2. **User Attribution**
   - `created_by`, `updated_by`, `deleted_by`

3. **Activity Logs**
   - `user_activity_logs` - Before/after JSON snapshots

4. **Status Logs**
   - `order_status_log` - Order lifecycle
   - `cron_log` - Automation execution

### Soft Delete Pattern

Tables with business significance use soft deletes:

- `deleted_at IS NULL` = active records
- `deleted_at IS NOT NULL` = deleted records

**Affected Tables:** product, product_variant, customer_order, warehouse, supplier, user, cinema entities, etc.

### Permission System

**Resource → Actions Mapping:**

- Resources: product, order, customer, inventory, reports, settings
- Actions: create, read, update, delete
- Special role: OWNER (all permissions)

---

## 📈 Performance Considerations

### Indexes

Major indexes exist on:

- Primary keys (UUID)
- Foreign keys (`*_id` columns)
- Unique constraints (SKU, barcode, username)
- Status columns (for filtering)
- Timestamp columns (for date range queries)

### DataLoader Pattern (Application Layer)

N+1 query prevention via `LoaderFactory`:

- `productImageLoader` - Batch load product images
- `productVariantLoader` - Batch load variants
- `warehouseLoader` - Batch load warehouse data
- `inventoryLoader` - Batch load inventory

### Large Tables

Tables with high row counts:

1. `cron_log` - 8,236 rows (consider archiving)
2. `cinema_seat` - 450 rows (static configuration)
3. `customer_order` - 123 rows (growing)
4. `inventory_transactions` - Audit log (growing)

**Recommendation:** Implement data retention policies for logs

---

## 🚀 Best Practices

### Query Patterns

1. **Always filter by `deleted_at IS NULL`** for active records
2. **Use warehouse_id** for multi-tenant isolation
3. **Join inventory → slot → warehouse** for location-aware queries
4. **Calculate totals** using formula columns (e.g., order totals)
5. **Use transaction types** to filter inventory_transactions

### Data Integrity

1. **Soft deletes** preserve referential integrity
2. **JSON snapshots** in logs capture state changes
3. **Enum constraints** enforce valid status values
4. **Timestamp tracking** enables audit trails
5. **Status workflows** prevent invalid transitions

### Schema Evolution

1. **Migrations** in `src/lib/db/migrations/`
2. **Run `npm run table`** after schema changes
3. **Test in development** before production
4. **Backup before major changes**

---

## 📞 Support & Maintenance

### Key Cron Jobs

| Job                    | Schedule | Purpose                    |
| ---------------------- | -------- | -------------------------- |
| Daily Cinema Report    | 12 AM    | Email ticket sales         |
| Apply Scheduled Prices | 2 AM     | Update supplier pricing    |
| Clean Expired Tokens   | Hourly   | Remove old customer tokens |

**Enable Cron:** Set `ENABLE_CRON=true` environment variable

### Environment Variables

```env
DB_MAIN=mysql://user:pass@host:port/database
TIMEZONE=Asia/Phnom_Penh
SMTP_HOST=smtp.example.com
SMTP_USER=noreply@example.com
SMTP_PASSWORD=***
CINEMA_REPORT_RECIPIENTS=manager@example.com,owner@example.com
ENABLE_CRON=true
```

### Monitoring

1. **Check `cron_log`** for job failures
2. **Monitor `inventory_transactions`** for anomalies
3. **Review `user_activity_logs`** for security
4. **Track `backlog_orders`** for stock issues
5. **Analyze `order_status_log`** for workflow problems

---

**Document Version:** 1.0  
**Last Updated:** March 6, 2026  
**Maintainer:** L-POS Development Team
