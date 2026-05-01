/* eslint-disable @typescript-eslint/no-explicit-any */
import { SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { UserInput } from "@/lib/types";
import React, { useCallback, useEffect, useState } from "react";
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
import {
  useMutationCreateBindUser,
  useQueryBindUserGroup,
  useQueryBindUserList,
} from "@/app/hooks/use-query-bind-user";
import { BindUserSection, BindUserEntry } from "./bind-user-section";

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

// Inner component used when editing so hooks are always called with a real id
function EditUserSheet({
  close,
  edit,
}: {
  close: (v: UserInput | null) => void;
  edit: UserInput;
}) {
  const [userInput, setUserInput] = useState<UserInput>(edit);
  const [error, setError] = useState("");
  const [removeRole] = useState<string[]>([]);
  const [bindEntries, setBindEntries] = useState<BindUserEntry[]>([]);

  const { trigger: update, isMutating: updateLoading } = useUpdateUser();
  const { trigger: deleteRole, isMutating: deleteLoading } =
    useDeleteUserRoles();
  const { data: bindUserGroupData, isLoading: bindUserGroupLoading } =
    useQueryBindUserGroup(edit.id!);
  const { data: bindUserListData, isLoading: bindUserListLoading } =
    useQueryBindUserList(edit.id!);
  const { trigger: createBindUser, isMutating: bindUserSaving } =
    useMutationCreateBindUser();

  const bindLoading = bindUserGroupLoading || bindUserListLoading;
  const group: number = (bindUserGroupData?.result as number) ?? 1;

  // Initialise bind entries once the API data arrives
  useEffect(() => {
    if (bindUserListLoading || bindUserGroupLoading) return;
    const list: BindUserEntry[] =
      bindUserListData?.result?.map((x: any) => {
        return {
          userId: x.userId,
          group: x.group,
          isMain: x.isMain,
          warehouseId: x.user.warehouseId.id || "",
        };
      }) ?? [];
    if (list.length > 0) {
      setBindEntries(list);
    } else {
      // No existing bindings – pre-populate the main user entry so it is
      // included when the user starts adding warehouses.
      setBindEntries([
        {
          userId: edit.id!,
          warehouseId: edit.warehouseId,
          group,
          isMain: true,
        },
      ]);
    }
  }, [
    bindUserListLoading,
    bindUserGroupLoading,
    bindUserListData,
    bindUserGroupData,
    edit.id,
    edit.warehouseId,
    group,
  ]);

  const handleBindChange = useCallback((entries: BindUserEntry[]) => {
    setBindEntries(entries);
  }, []);

  const onSave = useCallback(async () => {
    setError("");
    try {
      if (removeRole.length > 0) {
        await deleteRole({ id: removeRole });
      }

      const updateResult = await update(userInput);
      if (!updateResult) {
        setError("Something went wrong. Please try again!");
        return;
      }

      // Always send the full bind list so the server can diff additions/deletions
      if (bindEntries.length > 0) {
        const bindEntriesToSend = bindEntries.map((e) => ({
          userId: e.userId,
          warehouseId: e.warehouseId,
          group,
          isMain: e.isMain,
          isNew: e.isNew,
        }));
        if (!bindEntriesToSend.some((e) => e.isMain)) {
          bindEntriesToSend.push({
            userId: edit.id!,
            warehouseId: edit.warehouseId,
            group,
            isMain: true,
            isNew: false,
          });
        }
        await createBindUser(bindEntriesToSend);
      }

      close(userInput);
      toast.success("User updated");
    } catch {
      setError("Something went wrong. Please try again!");
    }
  }, [
    update,
    userInput,
    close,
    removeRole,
    deleteRole,
    bindEntries,
    createBindUser,
    group,
    edit,
  ]);

  const isSaving = updateLoading || deleteLoading || bindUserSaving;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit User</SheetTitle>
      </SheetHeader>
      <div className="my-2 flex flex-col gap-4">
        <UserForm
          userInput={userInput}
          setUserInput={setUserInput}
          setRoleRemove={() => {}}
          edit
        />
        <BindUserSection
          mainUserId={edit.id!}
          group={group}
          entries={bindEntries}
          onChange={handleBindChange}
          loading={bindLoading}
        />
      </div>
      <SheetFooter>
        {error && <small className="text-rose-600">{error}</small>}
        <Button onClick={onSave} size="sm" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </SheetFooter>
    </>
  );
}

// Inner component for creating a new user
function CreateUserSheet({ close }: { close: (v: UserInput | null) => void }) {
  const { currentWarehouse } = useAuthentication();
  const [userInput, setUserInput] = useState<UserInput>({
    ...EMPTY_VALUE,
    id: v4(),
    warehouseId: currentWarehouse?.id + "",
  });
  const [error, setError] = useState("");
  const { trigger: create, isMutating: createLoading } = useCreateUser();

  const onCreate = useCallback(async () => {
    setError("");
    await create(userInput)
      .then((res) => {
        if (res?.id) {
          close(userInput);
          toast.success("Create new user");
        } else {
          setError("Something went wrong. Please try again!");
        }
      })
      .catch(() => {
        setError("Something went wrong. Please try again!");
      });
  }, [create, userInput, close]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>Create User</SheetTitle>
      </SheetHeader>
      <div className="my-2">
        <UserForm
          userInput={userInput}
          setUserInput={setUserInput}
          setRoleRemove={() => {}}
          edit={false}
        />
      </div>
      <SheetFooter>
        {error && <small className="text-rose-600">{error}</small>}
        <Button onClick={onCreate} size="sm" disabled={createLoading}>
          {createLoading ? "Creating…" : "Create"}
        </Button>
      </SheetFooter>
    </>
  );
}

export const createUserSheet = createSheet<
  {
    edit: UserInput | undefined;
  },
  UserInput | null
>(
  ({ close, edit }) => {
    if (edit) {
      return <EditUserSheet close={close} edit={edit} />;
    }
    return <CreateUserSheet close={close} />;
  },
  { defaultValue: null },
);
