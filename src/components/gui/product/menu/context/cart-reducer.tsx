import { produce } from "immer";
import { CartAction as CartActionClass } from "./cart-action";
import { CartAction } from "./cart-action-type";
import { CartState } from "./cart-provider";

export function cartReducer(state: CartState, action: CartAction): CartState {
  return produce(state, (draft) => {
    switch (action.type) {
      case "FIRST_ORDER":
        CartActionClass.handleFirstOrder(draft, action.payload);
        break;
      case "SELECT_PRODUCT":
        CartActionClass.handleSelectProduct(draft, action.payload);
        break;
      case "REMOVE_PRODUCT":
        CartActionClass.handleRemoveProduct(draft, action.payload);
        break;
      case "UPDATE_PRODUCT_QTY":
        CartActionClass.handleUpdateProductQty(draft, action.payload);
        break;
      case "SYNC_STATE":
        // Sync external data changes (from SWR revalidation)
        Object.assign(draft, action.payload);
        break;
      default:
        break;
    }
  });
}
