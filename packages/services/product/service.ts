import { CreateProductInputType, createProductInput } from "./model.js";

class ProductService {
    public async createProductService(payload: CreateProductInputType) {
        const { name, price, description } = await createProductInput.parseAsync(payload)
        return {
            name,
            price,
            description
        }
    }
}
export default ProductService;
