import {
  CheckoutPaymentService,
  PaymentDraftInput,
  PaymentDraftSchema,
} from "@/classes/cinema/checkout-payment";
import withAuthApi from "@/lib/server-functions/with-auth-api";
import { ResponseType } from "@/lib/types";
import { NextResponse } from "next/server";

export const createPaymentBookingDraft = withAuthApi<
  unknown,
  PaymentDraftInput,
  ResponseType<unknown>
>(
  async ({ db, userAuth, body }) => {
    const user = {
      ...userAuth.customer!,
      username: "",
      token: "",
      profile: "",
      roleId: "",
      fullname: "",
    };
    const input = PaymentDraftSchema.parse(body);

    const checkoutPaymentService = new CheckoutPaymentService(db, user);
    const res = await checkoutPaymentService.createPaymentOrderCustomer(input);

    return NextResponse.json(
      {
        success: true,
        data: res,
      },
      { status: 200 },
    );
  },
  ["CUSTOMER"],
);
