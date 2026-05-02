import { Knex } from "knex";
import { appliedProductDiscountLoader } from "./applie-discount-loader";
import { createBasicProductLoader } from "./basic-product-loader";
import { createCategoryByProductLoader } from "./category-by-product-loader";
import { createCompositeVariantLoader } from "./composite-variant-loader";
import { createDiscountByOrderItemLoader } from "./discount-by-order-items-loader";
import { createDiscountByProductLoader } from "./discount-by-product-loader";
import { createDiscountLoader } from "./discount-loader";
import {
  createFulfilmentDetailByTransactionIDLoader,
  createFulfilmentLoader,
} from "./fulfilment-loader";
import { createInventoryTransactionLoader } from "./inventory-transaction-loader";
import {
  createModifierItemLoader,
  createModifierLoader,
} from "./modifier-loader";
import { createModifierItemByIdLoader } from "./modifier-item-by-id-loader";
import { createModifierByProductLoader } from "./modifier-product-loader";
import { createOrderDetailLoader } from "./order-detail-loader";
import {
  createOrderLoader,
  createOrderLoaderByCustomerId,
} from "./order-loader";
import { createOrderModifierLoader } from "./order-modifier-loader";
import { createOrderReturnByOrderDetailLoader } from "./order-return-by-order-detail-loader";
import { createOrderStatusItemLoader } from "./order-status-item.loader";
import { createProductCategoryLoader } from "./product-category-loader";
import { createProductImageLoader } from "./product-image-loader";
import { createProductLot } from "./product-lot";
import { createProductOptionValueLoader } from "./product-option-value-loader";
import { createProductVariantByIdLoader } from "./product-variant-by-id-loader";
import { createProductVariantConversionLoader } from "./product-variant-conversion-loader";
import { createProductVariantLoader } from "./product-variant-loader";
import {
  createReceivedPOLoader,
  createSupplierPurchaseOrderLoader,
  receivePOBytransactionIDLoader,
} from "./receive-po-loader";
import { createRoleLoader } from "./role-loader";
import { createSlotLoader } from "./slot-loader";
import { createSupplierLoader } from "./supplier-loader";
import { createUserLoader } from "./user-loader";
import { createVariantImageLoader } from "./variant-image-loader";
import { createVariantSlotStockLoader } from "./variant-slot-stock-loader";
import { createVariantStockLoader } from "./variant-stock-loader";
import { createWarehouseLoader } from "./warehouse-loader";
import { getOrderPaymentLoader } from "./order-payment-loader";
import {
  createCinemaHallLoader,
  createCinemaHallSeatLoader,
  createCinemaSeatLoader,
} from "./cinema-hall-seat-loader";
import { createMovieByVariantIDLoader } from "./movie-loader";
import { createPricingTemplateLoader } from "./pricing-template-loader";
import { createCustomerLoader } from "./customer-loader";
import {
  createCinemaReservationByOrderDetailLoader,
  createCinemaReservationByShowtimeLoader,
} from "./cenima-reservation-loader";
import { createShowtimeLoader } from "./showtime-loader";
import { createChartOfAccountsLoader } from "./chart-of-accounts-loader";
import { createWarehouseGroupByGroupIdLoader } from "./warehouse-group-loader";
import { createGroupProductByGroupIdLoader } from "./group-product-loader";
import { createKitchenLogByOrderDetailLoader } from "./kitchen-log-loader";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";

export class LoaderFactory {
  static productImageLoader(db: Knex) {
    return createProductImageLoader(db);
  }

  static productCategoryLoader(db: Knex) {
    return createProductCategoryLoader(db);
  }

  static categoryByProductLoader(db: Knex) {
    return createCategoryByProductLoader(db);
  }

  static productOptionValueLoader(db: Knex) {
    return createProductOptionValueLoader(db);
  }

  static userLoader(db: Knex) {
    return createUserLoader(db);
  }
  static supplierLoader(db: Knex) {
    return createSupplierLoader(db);
  }

  static warehouseLoader(db: Knex) {
    return createWarehouseLoader(db);
  }

  static variantStockLoader(
    db: Knex,
    warehouseId: string,
    forReplenishment?: boolean,
  ) {
    return createVariantStockLoader(db, warehouseId, forReplenishment);
  }

  static productVariantByIdLoader(db: Knex, warehouseId?: string) {
    return createProductVariantByIdLoader(db, warehouseId);
  }

  static productVariantLoader(db: Knex, warehouseId: string, user?: UserInfo) {
    return createProductVariantLoader(db, warehouseId, user);
  }

  static discountLoader(db: Knex) {
    return createDiscountLoader(db);
  }

  static orderDetailLoader(db: Knex, warehouseId: string) {
    return createOrderDetailLoader(db, warehouseId);
  }

  static productLotLoader(db: Knex) {
    return createProductLot(db);
  }

  static slotLoader(db: Knex) {
    return createSlotLoader(db);
  }

  static roleLoader(db: Knex) {
    return createRoleLoader(db);
  }

  static inventoryTransactionLoader(db: Knex, warehouseId: string) {
    return createInventoryTransactionLoader(db, warehouseId);
  }

  static basicProductLoader(db: Knex) {
    return createBasicProductLoader(db);
  }

  static fulfilmentLoader(db: Knex) {
    return createFulfilmentLoader(db);
  }

  static fulfilmentDetailByIDLoader(db: Knex) {
    return createFulfilmentDetailByTransactionIDLoader(db);
  }

  static orderLoader(db: Knex) {
    return createOrderLoader(db);
  }

  static receivePODetailByTrasactionIDLoader(db: Knex) {
    return receivePOBytransactionIDLoader(db);
  }

  static receivePOLoader(db: Knex) {
    return createReceivedPOLoader(db);
  }

  static supplierPurchaseOrderLoader(db: Knex) {
    return createSupplierPurchaseOrderLoader(db);
  }

  static variantSlotStockLoader(db: Knex, warehouseId: string) {
    return createVariantSlotStockLoader(db, warehouseId);
  }

  static orderReturnByOrderDetailLoader(db: Knex) {
    return createOrderReturnByOrderDetailLoader(db);
  }

  static compositeVariantLoader(db: Knex, warehouseId: string) {
    return createCompositeVariantLoader(db, warehouseId);
  }

  static variantImageLoader(db: Knex) {
    return createVariantImageLoader(db);
  }

  static discountByOrderItemLoader(db: Knex) {
    return createDiscountByOrderItemLoader(db);
  }

  static productVariantConversionLoader(db: Knex, warehouseId: string) {
    return createProductVariantConversionLoader(db, warehouseId);
  }
  static modifierByProductLoader(db: Knex) {
    return createModifierByProductLoader(db);
  }

  static modifierLoader(db: Knex) {
    return createModifierLoader(db);
  }

  static modifierItemLoader(db: Knex) {
    return createModifierItemLoader(db);
  }

  static modifierItemByIdLoader(db: Knex) {
    return createModifierItemByIdLoader(db);
  }

  static orderStatusItemLoader(db: Knex) {
    return createOrderStatusItemLoader(db);
  }

  static orderModifierLoader(db: Knex) {
    return createOrderModifierLoader(db);
  }

  static discountByProductLoader(db: Knex, warehouseId: string) {
    return createDiscountByProductLoader(db, warehouseId);
  }

  static appliedDiscountLoader(db: Knex) {
    return appliedProductDiscountLoader(db);
  }

  static orderPaymentLoader(db: Knex) {
    return getOrderPaymentLoader(db);
  }

  static cinemaHallSeatLoader(db: Knex) {
    return createCinemaHallSeatLoader(db);
  }

  static movieByVariantIDLoader(db: Knex) {
    return createMovieByVariantIDLoader(db);
  }

  static cinemaPricingTemplateLoader(db: Knex) {
    return createPricingTemplateLoader(db);
  }

  static customerLoader(db: Knex) {
    return createCustomerLoader(db);
  }

  static cinemaHallLoader(db: Knex) {
    return createCinemaHallLoader(db);
  }

  static cinemaReservationByShowTimeLoader(db: Knex) {
    return createCinemaReservationByShowtimeLoader(db);
  }

  static cinemaReservationByOrderDetailLoader(db: Knex) {
    return createCinemaReservationByOrderDetailLoader(db);
  }

  static cinemaSeatLoader(db: Knex) {
    return createCinemaSeatLoader(db);
  }

  static showtimeLoader(db: Knex) {
    return createShowtimeLoader(db);
  }

  static orderLoaderByCustomerId(db: Knex) {
    return createOrderLoaderByCustomerId(db);
  }

  static chartOfAccountsLoader(db: Knex) {
    return createChartOfAccountsLoader(db);
  }

  static warehouseGroupByGroupIdLoader(db: Knex) {
    return createWarehouseGroupByGroupIdLoader(db);
  }

  static groupProductByGroupIdLoader(db: Knex) {
    return createGroupProductByGroupIdLoader(db);
  }

  static kitchenLogByOrderDetailLoader(db: Knex) {
    return createKitchenLogByOrderDetailLoader(db);
  }
}
