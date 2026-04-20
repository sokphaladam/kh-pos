import { Knex } from "knex";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import getKnex from "../knex";

export default function withDatabaseApi<
  ParamType = unknown,
  InputType = unknown,
  OutputType = unknown,
  SearchParamType = unknown
>(
  callback: (props: {
    db: Knex;
    req: NextRequest;
    body?: InputType;
    params?: ParamType;
    searchParams?: SearchParamType;
  }) => Promise<NextResponse<OutputType>>
) {
  return async function handler(
    req: NextRequest,
    params: { params: Promise<ParamType> }
  ) {
    const db = await getKnex();

    try {
      const headerList = await headers();
      const body =
        headerList.get("Content-Type") === "application/json"
          ? await req.json()
          : undefined;

      // Extract search parameters
      const searchParams = req.nextUrl.searchParams
        ? (Object.fromEntries(
            req.nextUrl.searchParams.entries()
          ) as SearchParamType)
        : undefined;

      // Execute callback
      const response = await callback({
        db,
        req,
        params: await params.params,
        searchParams,
        body,
      });

      return response;
    } catch (error) {
      console.error("Error in withAuthApi handler:", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
    // No finally block needed - the singleton Knex instance manages its own connection pool
    // Destroying it here would affect other concurrent requests
  };
}
