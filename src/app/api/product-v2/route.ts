import { createProduct } from "./create-product";
import { deleteProduct } from "./delete-product";
import { getProductList } from "./get-product";
import { updateProduct } from "./update-product";

export const GET = getProductList;

export const POST = createProduct;

export const PUT = updateProduct;

export const DELETE = deleteProduct;
