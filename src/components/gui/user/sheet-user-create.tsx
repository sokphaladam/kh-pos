import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { UserInput } from "@/lib/types";
import React, { useCallback, useState } from "react";
import { UserForm } from "./user-form";
import { Button } from "@/components/ui/button";
import {
  useCreateUser,
  useDeleteUserRoles,
  useUpdateUser,
} from "@/app/hooks/use-query-user";
import { createSheet } from "@/components/create-sheet";
import { v4 } from "uuid";
import { toast } from "sonner";
import { useAuthentication } from "../../../../contexts/authentication-context";

const userId = v4();

const EMPTY_VALUE: UserInput = {
  phoneNumber: "",
  username: "",
  password: "",
  roleId: "3f975657-f2c2-11ef-b03a-5a2b7664f615",
  warehouseId: "",
  fullname: "",
  profile: "",
  id: userId,
};

export const createUserSheet = createSheet<
  {
    edit: UserInput | undefined;
  },
  UserInput | null
>(
  ({ close, edit }) => {
    const { currentWarehouse } = useAuthentication();
    const [userInput, setUserInput] = useState<UserInput>(
      edit ? edit : { ...EMPTY_VALUE, warehouseId: currentWarehouse?.id + "" }
    );
    const [error, setError] = useState("");
    const [removeRole] = useState<string[]>([]);
    const { trigger: create, isMutating: createLoading } = useCreateUser();
    const { trigger: update, isMutating: updateLoading } = useUpdateUser();
    const { trigger: deleteRole, isMutating: deleteLoading } =
      useDeleteUserRoles();

    const onCreate = useCallback(async () => {
      if (edit) {
        if (removeRole.length > 0) {
          await deleteRole({ id: removeRole });
        }
        await update(userInput)
          .then((res) => {
            if (res) {
              if (res) {
                close(userInput);
                toast.success("Update user");
              } else {
                setError("Somthing was wrong. please try again!");
              }
            }
          })
          .catch(() => {
            setError("Somthing was wrong. please try again!");
          });
      } else {
        await create(userInput)
          .then((res) => {
            if (res) {
              if (res.id) {
                close(userInput);
                toast.success("Create new user");
              } else {
                setError("Somthing was wrong. please try again!");
              }
            }
          })
          .catch(() => {
            setError("Somthing was wrong. please try again!");
          });
      }
    }, [create, userInput, close, update, edit, removeRole, deleteRole]);

    return (
      <>
        <SheetHeader>
          <SheetTitle>{edit ? "Edit" : "Create"} User</SheetTitle>
        </SheetHeader>
        <div className="my-2">
          <UserForm
            userInput={userInput}
            setUserInput={setUserInput}
            setRoleRemove={() => {}}
            edit={!!edit}
          />
        </div>
        <SheetFooter>
          {error && <small className="text-rose-600">{error}</small>}
          <Button
            onClick={onCreate}
            size={"sm"}
            disabled={createLoading || updateLoading || deleteLoading}
          >
            Save
          </Button>
        </SheetFooter>
      </>
    );
  },
  { defaultValue: null }
);
