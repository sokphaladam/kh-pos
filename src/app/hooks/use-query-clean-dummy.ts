import { useGenericSubscription } from "./use-generic";

export function useSubscriptionCleanDummy(enabled: boolean = false) {
  return useGenericSubscription({
    method: "POST",
    url: "/api/setting/clean",
    body: {},
    enabled,
  });
}
