"use client";

import {
  useLazyQueryCustomer,
  useMutationCreateCustomer,
  useMutationUpdateCustomerIdInCustomerOrder,
} from "@/app/hooks/use-query-customer";
import { Customer } from "@/classes/customer";
import { createSheet } from "@/components/create-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Utensils,
  ShoppingBag,
  Plus,
  Search,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestaurantTable, useRestaurant } from "../contexts/restaurant-context";
import { useRestaurantActions } from "../hooks/use-restaurant-actions";

interface Props {
  currentTable: RestaurantTable | undefined;
}

export const restaurantCustomFoodDelivery = createSheet<Props, unknown>(
  ({ currentTable, close }) => {
    const { state, onRefetch } = useRestaurant();
    const [servedType, setServedType] = useState<
      "dine_in" | "take_away" | "food_delivery"
    >(currentTable?.orders?.servedType || "dine_in");
    const [searchPhone, setSearchPhone] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
      null,
    );
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerExtraPrice, setNewCustomerExtraPrice] = useState(0);

    const [lazyQueryCustomer, { data: customerData }] = useLazyQueryCustomer(
      50,
      0,
      searchPhone || undefined,
      "delivery",
    );

    const { trigger: createCustomer, isMutating: isCreating } =
      useMutationCreateCustomer();
    const {
      trigger: triggerUpdateCustomerIdInCustomerOrder,
      isMutating: isUpdatingCustomerId,
    } = useMutationUpdateCustomerIdInCustomerOrder(
      currentTable?.orders?.orderId || "",
    );
    const { setFoodDelivery } = useRestaurantActions();

    // Fetch delivery customers when component mounts or served type changes to food_delivery
    useEffect(() => {
      if (servedType === "food_delivery") {
        lazyQueryCustomer();
      }
    }, [servedType, lazyQueryCustomer]);

    // Search customers by phone
    const handlePhoneSearch = useCallback(() => {
      if (searchPhone.trim()) {
        lazyQueryCustomer();
      }
    }, [searchPhone, lazyQueryCustomer]);

    // Handle phone input change with debounce effect
    useEffect(() => {
      if (searchPhone && servedType === "food_delivery") {
        const debounceTimer = setTimeout(() => {
          handlePhoneSearch();
        }, 500);
        return () => clearTimeout(debounceTimer);
      }
    }, [searchPhone, servedType, handlePhoneSearch]);

    const deliveryCustomers = useMemo(() => {
      return customerData?.result?.data || [];
    }, [customerData]);

    const handleCreateNewCustomer = useCallback(async () => {
      if (!newCustomerName.trim() || !searchPhone.trim()) return;

      try {
        const result = await createCustomer({
          customerName: newCustomerName,
          phone: searchPhone,
          address: "",
          type: "delivery",
          extraPrice: newCustomerExtraPrice,
        });

        if (result.success) {
          setNewCustomerName("");
          setNewCustomerExtraPrice(0);
          setShowCreateForm(false);
          lazyQueryCustomer();
        }
      } catch (error) {
        console.error("Failed to create customer:", error);
      }
    }, [
      newCustomerName,
      searchPhone,
      newCustomerExtraPrice,
      createCustomer,
      lazyQueryCustomer,
    ]);

    const getServedTypeIcon = (type: string) => {
      switch (type) {
        case "dine_in":
          return <Utensils className="h-4 w-4" />;
        case "take_away":
          return <ShoppingBag className="h-4 w-4" />;
        case "food_delivery":
          return <Truck className="h-4 w-4" />;
        default:
          return null;
      }
    };

    const getServedTypeLabel = (type: string) => {
      switch (type) {
        case "dine_in":
          return "Dine In";
        case "take_away":
          return "Take Away";
        case "food_delivery":
          return "Food Delivery";
        default:
          return "";
      }
    };

    return (
      <>
        <SheetHeader>
          <SheetTitle>Order Served Type</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-6">
          {/* Order Info */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Invoice No:</span>{" "}
            {currentTable?.orders?.invoiceNo}
          </div>

          {/* Served Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="served-type" className="text-sm font-medium">
              Select Served Type
            </Label>
            <Select
              value={servedType}
              onValueChange={(
                value: "dine_in" | "take_away" | "food_delivery",
              ) => {
                setServedType(value);
                setSelectedCustomer(null);
                setSearchPhone("");
                setShowCreateForm(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose order type">
                  <div className="flex items-center gap-2">
                    {getServedTypeIcon(servedType)}
                    <span>{getServedTypeLabel(servedType)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine_in">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    <span>Dine In</span>
                  </div>
                </SelectItem>
                <SelectItem value="take_away">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    <span>Take Away</span>
                  </div>
                </SelectItem>
                <SelectItem value="food_delivery">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Food Delivery</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Food Delivery Section */}
          {servedType === "food_delivery" && (
            <>
              <Separator />

              {/* Phone Search */}
              <div className="space-y-3">
                <Label htmlFor="phone-search" className="text-sm font-medium">
                  Search Delivery Customer
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone-search"
                      type="text"
                      placeholder="Enter delivery customer"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handlePhoneSearch}
                    variant="outline"
                    size="icon"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Customer List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Delivery Customers ({deliveryCustomers.length})
                  </Label>
                  {searchPhone && (
                    <Button
                      onClick={() => {
                        setNewCustomerName(searchPhone);
                        setShowCreateForm(!showCreateForm);
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create New
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[200px] border rounded-md">
                  {deliveryCustomers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {searchPhone
                        ? "No customers found for this phone number"
                        : "No delivery customers available"}
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {deliveryCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedCustomer?.id === customer.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="font-medium text-sm">
                            {customer.customerName}
                          </div>
                          {customer.address && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                          {Number(customer.extraPrice) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <DollarSign className="h-3 w-3" />
                              <span>Extra: ${customer.extraPrice}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Quick Create New Customer */}
              {showCreateForm && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Quick Create Customer
                    </Label>

                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        id="customer-name"
                        type="text"
                        placeholder="Customer name *"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />

                      <div className="flex gap-2">
                        <Input
                          id="extra-price"
                          type="number"
                          placeholder="Extra fee (optional)"
                          step="0.01"
                          min="0"
                          value={newCustomerExtraPrice || ""}
                          onChange={(e) =>
                            setNewCustomerExtraPrice(
                              Number(e.target.value) || 0,
                            )
                          }
                          className="flex-1"
                        />
                        <Button
                          onClick={handleCreateNewCustomer}
                          disabled={
                            !newCustomerName.trim() ||
                            !searchPhone.trim() ||
                            isCreating
                          }
                          className="px-6"
                        >
                          {isCreating ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Selected Customer Info */}
              {selectedCustomer && (
                <>
                  <Separator />
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Selected Customer
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedCustomer.customerName}
                    </div>
                    {selectedCustomer.address && (
                      <div className="text-xs text-blue-600">
                        {selectedCustomer.address}
                      </div>
                    )}
                    {selectedCustomer.extraPrice &&
                      Number(selectedCustomer.extraPrice) > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          Extra Delivery Fee: ${selectedCustomer.extraPrice}
                        </div>
                      )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="pt-4">
            <Button
              className="w-full"
              size="lg"
              disabled={isUpdatingCustomerId}
              onClick={() => {
                const input = {
                  code: "",
                  customerId:
                    servedType === "food_delivery"
                      ? selectedCustomer?.id || ""
                      : state.posInfo?.posCustomerId || "",
                  type: servedType,
                };
                triggerUpdateCustomerIdInCustomerOrder(input).then((res) => {
                  if (res.success && currentTable?.tables) {
                    setFoodDelivery(
                      currentTable.tables,
                      input.code,
                      servedType,
                      selectedCustomer || undefined,
                    );
                    onRefetch?.();
                    close(true);
                  }
                });
              }}
            >
              Update Order Type
            </Button>
          </div>
        </div>
      </>
    );
  },
  { defaultValue: null },
);
