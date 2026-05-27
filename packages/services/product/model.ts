import { z } from "zod";

export const createProductInput = z.object({
    name: z.string().min(5).describe("name of the product"),
    price: z.number().describe("price of the product"),
    description: z.string().describe("description of the product"),
})
export type CreateProductInputType = z.infer<typeof createProductInput>
