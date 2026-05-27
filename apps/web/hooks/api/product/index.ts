import { trpc } from "~/trpc/client";

export const useSubscription = (options?: { enabled?: boolean; retry?: boolean }) => {
  return trpc.product.getSubscription.useQuery(undefined, options);
};

export const usePlans = () => {
  return trpc.product.listPlans.useQuery();
};

export const useCheckout = () => {
  return trpc.product.checkout.useMutation();
};

export const useVerifyPayment = () => {
  return trpc.product.verifyPayment.useMutation();
};

export const useCancelSubscription = () => {
  return trpc.product.cancelSubscription.useMutation();
};
