import { generateSettlement } from "./generate-settlement";
import { setSettlement } from "./set-settlement";
import { getSettlementList } from "./settlement-list";

export const POST = generateSettlement;
export const GET = getSettlementList;
export const PUT = setSettlement;
