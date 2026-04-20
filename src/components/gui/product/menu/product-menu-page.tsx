"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ProductMenuLayout } from "./product-menu-layout";
import { ProductPublicLayout } from "./product-public-layout";
import { useSearchParams } from "next/navigation";
import { getCustomerCookies } from "@/lib/cookies/cookies";
import {
  useMutationCustomerWalkInLogin,
  useQueryCustomer,
} from "@/app/hooks/use-query-user";
import { useWarehouseList } from "@/app/hooks/use-query-warehouse";
import { getDistanceFromLatLonInMeters } from "@/lib/utils";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";
import { getDeviceInfo } from "@/lib/device-info";

export function ProductMenuPageRender() {
  const searchParams = useSearchParams();
  const session = getCustomerCookies();
  const warehouseId = useMemo(
    () => searchParams.get("warehouse") || "",
    [searchParams]
  );
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [zone, setZone] = useState(false);
  const { trigger, isMutating: isLoggingIn } = useMutationCustomerWalkInLogin();
  const { data: warehouseData, isLoading: isLoadingWarehouse } =
    useWarehouseList(1, 0, [warehouseId]);
  const {
    data: customerData,
    isLoading: isLoadingCustomer,
    mutate,
  } = useQueryCustomer();

  // Get user's location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      } catch (err) {
        console.warn("Location not available", err);
      }
    };

    getLocation();
  }, []);

  // Check if user is within warehouse zone
  useEffect(() => {
    if ((warehouseData?.result?.data.length || 0) > 0) {
      const warehouse = warehouseData?.result?.data.at(0);
      if (warehouse) {
        const radiusInMeters = 100;
        const distance = getDistanceFromLatLonInMeters(
          lat,
          lng,
          Number(warehouse?.lat),
          Number(warehouse?.lng)
        );
        const inZone = distance <= radiusInMeters;
        if (!inZone) {
          Cookies.remove("cus_session");
        }
        setZone(inZone);
      }
    }
  }, [lat, lng, warehouseData]);

  // Handle walk-in login if table param exists and no session
  useEffect(() => {
    async function handleWalkInLogin() {
      if (searchParams.get("table") && !session && !!zone) {
        const dataInput = {
          tableId: searchParams.get("table") || "",
          deviceId: uuidv4(),
          lat,
          lng,
          metaData: getDeviceInfo(),
        };

        trigger(dataInput)
          .then(async (res) => {
            if (res?.token) {
              Cookies.set("cus_session", JSON.stringify({ token: res.token }), {
                expires: 60 * 60 * 24,
                path: "/",
                sameSite: "lax" as const,
              });
              mutate();
            }
          })
          .catch((err) => {
            console.log("Walk-in login failed:", JSON.stringify(err));
          });
      }
    }

    handleWalkInLogin();
  }, [searchParams, session, trigger, lat, lng, zone, mutate]);

  if (!isLoggingIn && !isLoadingWarehouse && !isLoadingCustomer) {
    return (
      <>
        {session &&
        searchParams.get("table") &&
        customerData &&
        "user" in customerData ? (
          <ProductMenuLayout
            inZone={zone}
            warehouse={warehouseData?.result?.data.at(0)}
          />
        ) : (
          <ProductPublicLayout />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">Loading...</div>
  );
}
