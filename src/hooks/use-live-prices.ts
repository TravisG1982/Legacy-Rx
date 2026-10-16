import { useQuery } from "@tanstack/react-query";
import { getLivePrices } from "@/lib/pricing.functions";
import { planPrice, type PlanPrice } from "@/lib/pricing-types";
import type { MedKey, Plan } from "@/lib/legacyrx-data";

/**
 * Current LegacyRx (Site ID 533) prices, fetched through the server function.
 * Price mapping is by Product ID.
 */
export function useLivePrices() {
  const query = useQuery({
    queryKey: ["legacyrx-live-prices"],
    queryFn: () => getLivePrices(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const prices = query.data?.prices;
  return {
    prices,
    isLoading: query.isLoading,
    failed: query.data?.ok === false || query.isError,
    price: (med: MedKey, planId: Plan["id"]): PlanPrice => planPrice(prices, med, planId),
  };
}

function fmt(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/**
 * "From" monthly prices (12-month plan) for marketing copy, driven by the
 * live LegacyRx pricing API.
 */
export function useFromPrices() {
  const { price } = useLivePrices();
  const sema = price("sema", "3").monthly;
  const tirz = price("tirz", "3").monthly;
  return { sema, tirz, semaText: fmt(sema), tirzText: fmt(tirz) };
}
