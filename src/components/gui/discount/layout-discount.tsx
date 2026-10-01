"use client";

import { TopToolbar } from "@/components/top-toolbar";
import { sheetDiscount } from "./sheet-discount";
import { useQueryDiscount } from "@/app/hooks/use-query-discount";
import { useQueryPromotionSets } from "@/app/hooks/use-query-promotion-set";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListDiscount } from "./list-discount";
import { useCallback } from "react";
import { WithLayoutPermissionProps } from "@/hoc/with-layout-permission";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/ui/state";
import { ListPromotionSet } from "../promotion-set/list-promotion-set";
import { sheetPromotionSet } from "../promotion-set/sheet-promotion-set";
import { useTranslations } from "next-intl";

type DiscountTab = "discount" | "promotion-set";

export function LayoutDiscount(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("discount");
  const tab: DiscountTab =
    search.get("tab") === "promotion-set" ? "promotion-set" : "discount";

  const onChangeTab = useCallback(
    (value: string) => {
      // Pagination is per list, so drop it when switching tabs.
      const params = new URLSearchParams({ tab: value });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  return (
    <div className="w-full flex flex-col gap-4 relative">
      <Tabs value={tab} onValueChange={onChangeTab}>
        <TabsList>
          <TabsTrigger value="discount">{t("tabs.discounts")}</TabsTrigger>
          <TabsTrigger value="promotion-set">
            {t("tabs.promotionSets")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "discount" ? (
        <DiscountTab {...props} />
      ) : (
        <PromotionSetTab {...props} />
      )}
    </div>
  );
}

function DiscountTab(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const { data, isLoading, mutate } = useQueryDiscount(limit, offset);

  const onClickAdd = useCallback(async () => {
    // Handle add new discount logic here
    const res = await sheetDiscount.show({});
    if (res) {
      mutate();
    }
  }, [mutate]);

  if (isLoading) return <LoadingState label="Loading discounts" />;

  return (
    <>
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onClickAdd}
        text={"Discount"}
        data={[]}
      />
      <div>
        {data?.result?.data && (
          <ListDiscount
            total={data.result.total || 0}
            data={data.result.data || []}
            limit={limit}
            offset={offset}
            onDelete={(v) => v && mutate()}
            onEdit={(v) => v && mutate()}
            onApplied={() => mutate()}
          />
        )}
      </div>
    </>
  );
}

function PromotionSetTab(props: WithLayoutPermissionProps) {
  const search = useSearchParams();
  const offset = Number(search.get("offset") || 0);
  const limit = Number(search.get("limit") || 30);
  const t = useTranslations("discount.promotionSet");
  const { data, isLoading, mutate } = useQueryPromotionSets(limit, offset);

  const onClickAdd = useCallback(async () => {
    const saved = await sheetPromotionSet.show({});
    if (saved) mutate();
  }, [mutate]);

  if (isLoading) return <LoadingState label={t("loading")} />;

  return (
    <>
      <TopToolbar
        disabled={!props.allowCreate}
        onAddNew={onClickAdd}
        text={t("toolbar")}
        data={[]}
      />
      <ListPromotionSet
        total={data?.result?.total || 0}
        data={data?.result?.data || []}
        limit={limit}
        offset={offset}
        onChanged={() => mutate()}
      />
    </>
  );
}
