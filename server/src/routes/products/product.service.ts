import { Product } from "./product.model";

export const getProductCodes = async (): Promise<string[]> => {
  const products = await Product.findAll({
    attributes: ["productCode"],
    raw: true,
  });
  return products.map((p) => p.productCode);
};
