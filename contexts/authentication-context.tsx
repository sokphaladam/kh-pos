"use client";
import { ShiftType } from "@/app/api/shift/route";
import { useQueryShift } from "@/app/hooks/use-query-shift";
import { Setting, useQuerySetting } from "@/app/hooks/use-setting";
import { Warehouse } from "@/dataloader/warehouse-loader";
import { requestDatabase } from "@/lib/api";
import { safeNavigate } from "@/lib/client-utils";
import { UserInfo } from "@/lib/server-functions/get-auth-from-token";
import { ResponseType } from "@/lib/types";
import Cookies from "js-cookie";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { SWRResponse } from "swr";

export type AuthenticationContextType = {
  user?: UserInfo | null;
  isAuthenticated: boolean;
  currentWarehouse?: Warehouse | null;
  currentShift?: ShiftType | null;
  login: (token: string) => void;
  logout: () => void;
  mutate: () => void;
  setting?: SWRResponse<ResponseType<Setting[]>, unknown>;
  currency?: string; // For backward compatibility
  currencyCode?: string;
  currencySymbol?: string;
  formatCurrency?: (
    amount: number | string,
    options?: {
      showSymbol?: boolean;
      showCode?: boolean;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    },
  ) => string;
};

export const AuthenticationContext = createContext<AuthenticationContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  mutate: () => {},
});

export const useAuthentication = () => {
  return useContext(AuthenticationContext);
};

export const AuthenticationProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: UserInfo | null;
}) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const {
    data: shift,
    isLoading,
    mutate,
  } = useQueryShift(currentUser?.id, 30, 0);
  const setting = useQuerySetting();

  const onLogout = useCallback(() => {
    Cookies.remove("session", { path: "/" });
    setIsAuthenticated(false);
    safeNavigate("/");
  }, []);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
    }
  }, [user]);

  const onLogin = useCallback(async (token: string) => {
    const expires = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365);
    const isSecure = false;

    // Cookie options — only set secure flag when actually on HTTPS
    const cookieOptions = {
      expires,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
    };

    Cookies.set("session", JSON.stringify({ token }), cookieOptions);
    const result = await requestDatabase<{
      error?: string;
      message?: string;
      user?: UserInfo;
    }>("/api/user/me", "GET");

    const user = result.user;
    if (user && user.id) {
      Cookies.set("session", JSON.stringify(user), cookieOptions);
      setIsAuthenticated(true);
      // Navigate to admin instead of reload
      safeNavigate("/admin");
    } else {
      Cookies.remove("session", { path: "/" });
      setIsAuthenticated(false);
    }
  }, []);

  const currentWarehouse = currentUser?.warehouse;

  // Improved currentShift calculation with better error handling
  const currentShift = useMemo(() => {
    if (isLoading || !currentUser?.id || !shift?.result?.data) {
      return null;
    }

    const openShifts = shift.result.data.filter((f) => f.status === "OPEN");
    const userOpenShift = openShifts.find(
      (f) => f.opened_by?.id === currentUser.id,
    );

    return userOpenShift || null;
  }, [isLoading, currentUser?.id, shift?.result?.data]);

  // Memoize currency data for better performance
  const currencyData = useMemo(() => {
    const currencyCode =
      setting.data?.result?.find((f) => f.option === "CURRENCY")?.value ||
      "USD";
    const currencySymbol = getCurrencySymbol(currencyCode);
    const currency = currencySymbol; // For backward compatibility

    return {
      currencyCode,
      currencySymbol,
      currency,
      formatCurrency: (
        amount: number | string,
        options?: {
          showSymbol?: boolean;
          showCode?: boolean;
          minimumFractionDigits?: number;
          maximumFractionDigits?: number;
        },
      ) => formatCurrency(amount, currencyCode, options),
    };
  }, [setting.data]);

  return (
    <AuthenticationContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        login: onLogin,
        logout: onLogout,
        currentWarehouse,
        currentShift,
        mutate: () => mutate(),
        setting,
        ...currencyData,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
