/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsTable } from "@/components/product/product-table";

export const products: any[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=1",
    price: 89.99,
    stock: 150,
    availableAt: new Date("2024-03-10"),
  },
  {
    id: "2",
    name: "Gaming Mechanical Keyboard",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=2",
    price: 129.99,
    stock: 80,
    availableAt: new Date("2024-02-25"),
  },
  {
    id: "3",
    name: "4K Ultra HD Smart TV",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=3",
    price: 599.99,
    stock: 40,
    availableAt: new Date("2024-01-15"),
  },
  {
    id: "4",
    name: "Portable Power Bank 20,000mAh",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=4",
    price: 39.99,
    stock: 200,
    availableAt: new Date("2024-04-05"),
  },
  {
    id: "5",
    name: "Smartphone 5G",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=5",
    price: 799.99,
    stock: 60,
    availableAt: new Date("2024-02-12"),
  },
  {
    id: "6",
    name: "Noise Cancelling Earbuds",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=6",
    price: 129.99,
    stock: 100,
    availableAt: new Date("2024-03-08"),
  },
  {
    id: "7",
    name: "Smart Watch Series X",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=7",
    price: 249.99,
    stock: 90,
    availableAt: new Date("2024-02-28"),
  },
  {
    id: "8",
    name: "Wireless Charging Pad",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=8",
    price: 29.99,
    stock: 300,
    availableAt: new Date("2024-04-15"),
  },
  {
    id: "9",
    name: "Curved Gaming Monitor 32”",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=9",
    price: 399.99,
    stock: 50,
    availableAt: new Date("2024-03-20"),
  },
  {
    id: "10",
    name: "Wireless Ergonomic Mouse",
    status: "active",
    imageUrl: "https://picsum.photos/300/200?random=10",
    price: 59.99,
    stock: 120,
    availableAt: new Date("2024-03-25"),
  },
];

export default function ProductStoryPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Product
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <ProductsTable products={products} offset={0} totalProducts={20} />
      </TabsContent>
    </Tabs>
  );
}
