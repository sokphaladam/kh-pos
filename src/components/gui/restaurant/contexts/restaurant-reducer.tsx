import { produce } from "immer";
import { RestaurantaAction } from "../class/restaurant";
import { RestaurantAction } from "../class/restaurant-action-type";
import { RestaurantState } from "./restaurant-context";

export function restaurantReducer(
  state: RestaurantState,
  action: RestaurantAction,
): RestaurantState {
  return produce(state, (draft) => {
    switch (action.type) {
      case "SELECT_TABLE":
        RestaurantaAction.handleSelectTable(draft, action.payload);
        break;
      case "CREATE_TABLE":
        RestaurantaAction.handleCreateTable(draft, action.payload);
        break;
      case "UPDATE_TABLE":
        RestaurantaAction.handleUpdateTable(draft, action.payload);
        break;
      case "REMOVE_TABLE":
        RestaurantaAction.handleRemoveTable(draft, action.payload);
        break;
      case "RESET_TABLE_TO_AVAILABLE":
        RestaurantaAction.handleResetTableToAvailable(draft, action.payload);
        break;
      case "SELECT_PRODUCT":
        RestaurantaAction.handleSelectProduct(draft, action.payload);
        break;
      case "UPDATE_PRODUCT_QTY":
        RestaurantaAction.handleUpdateProductQty(draft, action.payload);
        break;
      case "REMOVE_PRODUCT":
        RestaurantaAction.handleRemoveProduct(draft, action.payload);
        break;
      case "SEND_TO_KITCHEN":
        RestaurantaAction.handleSendToKitchen(draft, action.payload);
        break;
      case "COMPLETED_PRODUCT":
        RestaurantaAction.handleCompleteProduct(draft, action.payload);
        break;
      case "SET_DISCOUNT":
        RestaurantaAction.handleSetDiscount(draft, action.payload);
        break;
      case "CHECKOUT":
        RestaurantaAction.handleCheckout(draft, action.payload);
        break;
      case "FIRST_ORDER":
        RestaurantaAction.handleFirstOrder(draft, action.payload);
        break;
      case "ADD_MODIFIER":
        RestaurantaAction.handleAddModifier(draft, action.payload);
        break;
      case "REMOVE_MODIFIER":
        RestaurantaAction.handleRemoveModifier(draft, action.payload);
        break;
      case "SET_NOTES":
        RestaurantaAction.handleSetNotes(draft, action.payload);
        break;
      case "REMOVE_ORDER":
        RestaurantaAction.handleRemoveOrder(draft, action.payload);
        break;
      case "TRANSFER_TABLE":
        RestaurantaAction.handleTransferTable(draft, action.payload);
        break;
      case "SET_CUSTOMER":
        RestaurantaAction.handleSetCustomer(draft, action.payload);
        break;
      case "SET_ORDER_PRINT_TIME":
        RestaurantaAction.handleSetOrderPrintTime(draft, action.payload);
        break;
      case "SYNC_STATE":
        // Sync external data changes (from SWR revalidation)
        Object.assign(draft, action.payload);
        break;
      case "SET_FOOD_DELIVERY":
        RestaurantaAction.handleSetFoodDelivery(draft, action.payload);
        break;
      default:
        break;
    }
  });
}
