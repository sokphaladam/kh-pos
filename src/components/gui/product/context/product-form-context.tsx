import { ProductInput } from "@/app/api/product-v2/create-product";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/app/hooks/use-query-product";
import { MovieInput } from "@/classes/movie";
import { generateId } from "@/lib/generate-id";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";

// Create helper function to generate default data with consistent IDs
const createDefaultProductData = () => {
  const optionValueId = generateId();

  const defaultOptionValue = {
    id: optionValueId,
    value: "ns",
  };

  const defaultOption = {
    id: generateId(),
    name: "default",
    values: [defaultOptionValue],
  };

  const defaultVariant = {
    id: generateId(),
    name: "ns",
    sku: "",
    price: 0,
    available: true,
    isDefault: true,
    purchasedCost: 0,
    isComposite: false,
    compositeVariants: [],
    optionValues: [defaultOptionValue],
    visible: true,
  };

  return {
    option: defaultOption,
    variant: defaultVariant,
  };
};

// Create function to generate fresh EMPTY_VALUE for each new product
const createEmptyValue = (): ProductInputWithCompositeDetails => {
  const defaultData = createDefaultProductData();

  return {
    productId: generateId(),
    productBasic: {
      title: "",
      description: "",
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      isComposite: false,
      useProduction: false,
      trackStock: false,
      isForSale: false,
      supplierId: null,
    },
    productCategories: [],
    productImages: [],
    productOption: [defaultData.option],
    productVariants: [defaultData.variant],
    productConversions: [],
  };
};

export interface ProductInputWithCompositeDetails extends ProductInput {
  productVariants: Array<
    Omit<ProductInput["productVariants"][number], "compositeVariants"> & {
      compositeVariants: Array<
        ProductInput["productVariants"][number]["compositeVariants"][number] & {
          image?: string;
          title?: string;
        }
      >;
    }
  >;
  productMovies?: MovieInput | undefined;
}

export const ProductFormContext = createContext<{
  product: ProductInputWithCompositeDetails;
  setProduct: (product: ProductInputWithCompositeDetails) => void;
  onSave: () => void;
  canSave: boolean;
  isMovie?: boolean;
}>({
  product: createEmptyValue(),
  setProduct: () => {},
  onSave: () => {},
  canSave: false,
});

export function useProductForm() {
  return useContext(ProductFormContext);
}

export function ProductFormContextProvider({
  children,
  defaultValue,
}: {
  children: React.ReactNode;
  defaultValue?: ProductInputWithCompositeDetails | null;
}) {
  const { push, back } = useRouter();
  const [product, setProduct] = useState<ProductInput>(
    defaultValue ? defaultValue : createEmptyValue(),
  );
  const { trigger: createProduct } = useCreateProduct();
  const { trigger: updateProduct } = useUpdateProduct();

  const isMovie = product.productCategories.some((cat) => {
    // Assuming "movies-category-id" is the ID for the movie category
    return cat.categoryId === "movies-category-id";
  });

  const onCreate = useCallback(async () => {
    // Validate movie products don't have multiple variants
    if (isMovie && product.productVariants.length > 1) {
      toast.error("Movie products can only have one variant");
      return false;
    }
    const res = (await createProduct({
      ...product,
      productVariants: product.productVariants.map((v) => {
        return {
          ...v,
          barcode: v.barcode === "" ? null : v.barcode,
          lowStockQty: v.lowStockQty,
          idealStockQty: v.idealStockQty,
          isComposite: v.isComposite ?? false,
          compositeVariants: v.compositeVariants ?? [],
        };
      }),
      productImages: product.productImages.map((m, idx) => {
        return {
          ...m,
          imageOrder: idx,
          productVariantId: m.productVariantId || "",
        };
      }),
      productConversions: product.productConversions || [],
    })) as {
      success: boolean;
      error: string;
    };
    if (res.success) {
      toast.success("Product has been created");
      return true;
    }
    toast.error(res.error);
    return false;
  }, [createProduct, product, isMovie]);

  const onUpdate = useCallback(async () => {
    const input: ProductInputWithCompositeDetails = {
      productId: product.productId,
      productBasic: product.productBasic,
      productCategories: product.productCategories.map((c) => {
        return {
          id: c.id,
          categoryId: c.categoryId,
        };
      }),
      productImages: product.productImages.map((m, idx) => {
        return {
          url: m.url,
          id: m.id,
          imageOrder: idx,
          productVariantId: m.productVariantId,
        };
      }),
      productOption: product.productOption.map((opt) => {
        return {
          id: opt.id,
          name: opt.name,
          values: opt.values,
        };
      }),
      productVariants: product.productVariants.map((v) => {
        return {
          id: v.id,
          isComposite: v.isComposite ?? false,
          available: v.available ?? true,
          isDefault: v.isDefault ?? false,
          name: v.name,
          optionValues: v.optionValues,
          purchasedCost: v.purchasedCost,
          compositeVariants: v.compositeVariants ?? [],
          barcode: v.barcode === "" ? null : v.barcode,
          price: Number(v.price),
          lowStockQty: v.lowStockQty,
          idealStockQty: v.idealStockQty,
          visible: v.visible ?? true,
        };
      }),
      productConversions: product.productConversions || [],
      productMovies: product.productMovies,
    };

    const res = (await updateProduct(input)) as {
      success: boolean;
      error: string;
    };

    if (res.success) {
      toast.success("Product has been update");
      return true;
    }
    toast.error(res.error);
    return false;
  }, [product, updateProduct]);

  const onSave = useCallback(async () => {
    if (defaultValue) {
      const update = await onUpdate();
      if (update) {
        back();
      }
    } else {
      const create = await onCreate();
      if (create) {
        push(`/admin/product`);
      }
    }
  }, [defaultValue, onUpdate, back, onCreate, push]);

  return (
    <ProductFormContext.Provider
      value={{
        product,
        setProduct,
        onSave,
        isMovie: isMovie,
        canSave: checkProductCanSave(product),
      }}
    >
      {children}
    </ProductFormContext.Provider>
  );
}

function checkProductCanSave(product: ProductInput) {
  let canSave = true;

  for (const basic of Object.keys(product.productBasic) as Array<
    keyof typeof product.productBasic
  >) {
    if (
      ![
        "description",
        "isComposite",
        "useProduction",
        "trackStock",
        "isForSale",
        "weight",
        "length",
        "width",
        "height",
        "supplierId",
      ].includes(basic)
    ) {
      if (!product.productBasic[basic]) {
        canSave = false;
        break;
      }
    }
  }

  if (product.productVariants.length === 0) {
    canSave = false;
  }

  return canSave;
}
