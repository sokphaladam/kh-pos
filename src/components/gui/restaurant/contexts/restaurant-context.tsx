import { InfoResponse } from "@/app/api/pos/info/route";
import { table_with_order } from "@/app/hooks/use-query-table";
import { Order, OrderDetail } from "@/classes/order";
import { OrderModifierType } from "@/dataloader/order-modifier-loader";
import { Warehouse } from "@/dataloader/warehouse-loader";
import { table_restaurant_tables } from "@/generated/tables";
import { Category } from "@/lib/server-functions/category/create-category";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { PaymentProps } from "../../pos/types/post-types";
import { RestaurantAction } from "../class/restaurant-action-type";
import { restaurantReducer } from "./restaurant-reducer";

export interface RestaurantOrderItem extends OrderDetail {
  notes?: OrderModifierType;
}

export interface RestaurantOrder extends Omit<Order, "payments"> {
  items: RestaurantOrderItem[];
  payments: PaymentProps[];
}

export interface RestaurantTable {
  tables?: table_restaurant_tables;
  orders?: RestaurantOrder;
}

export interface RestaurantState {
  tables: table_with_order[];
  activeTables: RestaurantTable[];
  loading?: boolean;
  categories: Category[];
  posInfo?: InfoResponse;
  currentWarehouse?: Warehouse;
}

// Context
type RestaurantContextType =
  | {
      state: RestaurantState;
      dispatch: React.Dispatch<RestaurantAction>;
      loading: boolean;
      setLoading: (v: boolean) => void;
      printingOrder: string | null;
      setPrintingOrder: (v: string | null) => void;
      isRequest: boolean;
      setIsRequest: (v: boolean) => void;
      onRefetch?: () => void;
    }
  | undefined;

const RestaurantContext = createContext<RestaurantContextType>(undefined);

// Provider
export function RestaurantProvider({
  children,
  initialState,
  onRefetch,
  processing,
}: {
  children: ReactNode;
  initialState: RestaurantState;
  onRefetch?: () => void;
  processing?: boolean;
}) {
  const [state, dispatch] = useReducer(restaurantReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [isRequest, setIsRequest] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<string | null>(null);

  const syncInitialState = useCallback(() => {
    dispatch({
      type: "SYNC_STATE",
      payload: {
        tables: initialState.tables,
        activeTables: initialState.activeTables,
        categories: initialState.categories,
        posInfo: initialState.posInfo,
        currentWarehouse: initialState.currentWarehouse,
      },
    });
  }, [initialState]);

  // Track previous processing state to detect when request completes
  const prevProcessingRef = useRef(processing);

  // Sync external state changes (when useQueryTable request completes)
  useEffect(() => {
    const wasProcessing = prevProcessingRef.current;
    const isNowProcessing = processing;

    // Only sync when request completes (was processing, now not processing)
    if (wasProcessing && !isNowProcessing) {
      syncInitialState();
    }

    // Update ref for next comparison
    prevProcessingRef.current = processing;
  }, [syncInitialState, processing]);

  return (
    <RestaurantContext.Provider
      value={{
        state,
        dispatch,
        loading,
        setLoading,
        printingOrder,
        setPrintingOrder,
        isRequest: isRequest || processing || false,
        setIsRequest,
        onRefetch,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

// Hook
export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
