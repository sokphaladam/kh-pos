"use client";
import { InfoResponse } from "@/app/api/pos/info/route";
import { Warehouse } from "@/dataloader/warehouse-loader";
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
import { RestaurantTable } from "../../../restaurant/contexts/restaurant-context";
import { CartAction } from "./cart-action-type";
import { cartReducer } from "./cart-reducer";

export interface CartState extends RestaurantTable {
  posInfo?: InfoResponse;
  currentWarehouse?: Warehouse;
}

type CartContextType =
  | {
      state: CartState;
      dispatch: React.Dispatch<CartAction>;
      loading: boolean;
      setLoading: (v: boolean) => void;
      isRequest: boolean;
      setIsRequest: (v: boolean) => void;
    }
  | undefined;

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

// Cart Provider Component
export function CartProvider({
  children,
  initialState,
  processing
}: {
  children: ReactNode;
  initialState: CartState;
  processing?: boolean;
}) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [isRequest, setIsRequest] = useState(false);

  const syncInitialState = useCallback(() => {
    dispatch({
      type: "SYNC_STATE",
      payload: initialState,
    });
  }, [initialState])

  // Track previous processing state to detect when request completes
    const prevProcessingRef = useRef(processing);

  useEffect(() => {
    const wasProcessing = prevProcessingRef.current;
    const isNowProcessing = processing;
    if(wasProcessing && !isNowProcessing) {
      syncInitialState()
    }
    // Update ref for next comparison
    prevProcessingRef.current = processing;
  }, [syncInitialState, processing]);

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        loading,
        setLoading,
        isRequest: isRequest || processing || false,
        setIsRequest,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
