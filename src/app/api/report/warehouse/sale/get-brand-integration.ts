import { Knex } from "knex";

interface filterSchemaType {
  startDate: string;
  endDate: string;
}

export async function getBrandIntegration(db: Knex, filter: filterSchemaType) {
  const setting = await db
    .table("setting")
    .where("option", "BRAND_INTEGRATION")
    .first();

  let brandIntegration: { name: string; url: string; token: string }[] = [];
  try {
    brandIntegration = setting?.value ? JSON.parse(setting.value) : [];
  } catch {
    brandIntegration = [];
  }
  const params = new URLSearchParams();
  if (filter.startDate) {
    params.append("startDate", filter.startDate);
  }
  if (filter.endDate) {
    params.append("endDate", filter.endDate);
  }

  if (brandIntegration.length === 0) {
    return [];
  }

  const results = await Promise.all(
    brandIntegration.map(async (integration) => {
      try {
        const myHeaders = new Headers();

        myHeaders.append("Authorization", "Bearer " + integration.token);

        const requestOptions: RequestInit = {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        };

        const res = await fetch(
          `${integration.url}/api/report/warehouse/sale?${params.toString()}`,
          requestOptions,
        );

        if (!res.ok) {
          return { name: integration.name, data: null };
        }
        const json = await res.json();
        return { name: integration.name, data: json.result.local };
      } catch {
        return { name: integration.name, data: null };
      }
    }),
  );

  return results;
}
