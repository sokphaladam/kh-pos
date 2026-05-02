import { Label } from "@/components/ui/label";
import { UserInput } from "@/lib/types";
import { useCallback } from "react";
import LabelInput from "@/components/label-input";
import { useUploadFileMinIO } from "@/app/hooks/use-upload-file";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { WarehouseDropdown } from "./warehouse-dropdown";
import { MaterialInput } from "@/components/ui/material-input";
import { RoleDropdown } from "./role-dropdown";

interface Props {
  userInput: UserInput;
  setUserInput: (user: UserInput) => void;
  setRoleRemove: (id: string) => void;
  edit: boolean;
}

export function UserForm(props: Props) {
  const { userInput, setUserInput, edit } = props;
  const { trigger, isMutating } = useUploadFileMinIO();

  const onChangeInput = useCallback(
    (key: keyof typeof userInput, value: unknown) => {
      setUserInput({
        ...userInput,
        [key]: value,
      });
    },
    [setUserInput, userInput],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="grid w-full items-center gap-2">
        <Avatar>
          {userInput.profile && (
            <AvatarImage src={userInput.profile} alt="@shadcn" />
          )}
          <AvatarFallback>
            {userInput.fullname
              .split(" ")
              .map((x) => x.charAt(0).toUpperCase())
              .join("")}
          </AvatarFallback>
        </Avatar>
        <LabelInput
          label="Profile"
          type="file"
          multiple={false}
          onChange={(e) => {
            if (e.target.files) {
              trigger({ file: e.target.files[0] })
                .then((res) => {
                  const url = res ? (res as { url: string }).url : "";
                  onChangeInput("profile", url);
                })
                .catch((err) => console.log(err));
            }
          }}
          disabled={isMutating}
        />
      </div>
      <div className="flex flex-row gap-4 mt-4">
        <div className="grid w-full items-center gap-2">
          <MaterialInput
            label="Fullname"
            type="text"
            value={userInput.fullname}
            onChange={(e) => {
              onChangeInput("fullname", e.target.value);
            }}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Enter full name"
            id="fullname"
          />
        </div>
        <div className="grid w-full items-center gap-2">
          <MaterialInput
            label="Phone number"
            type="tel"
            value={userInput.phoneNumber}
            onChange={(e) => {
              const value = e.target.value;
              const normalized = /^[1-9]/.test(value) ? "0" + value : value;
              onChangeInput("phoneNumber", normalized);
            }}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Enter phone number"
            id="phone"
          />
        </div>
      </div>
      {!edit && (
        <div className="flex flex-row gap-2 mt-4">
          <div className="grid w-full items-center gap-2">
            <MaterialInput
              label="Username"
              type="text"
              value={userInput.username}
              onChange={(e) => {
                onChangeInput("username", e.target.value);
              }}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Enter username"
              id="username"
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <MaterialInput
              label="Password"
              type="password"
              value={userInput.password}
              onChange={(e) => {
                onChangeInput("password", e.target.value);
              }}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="Enter password"
              id="password"
            />
          </div>
        </div>
      )}
      <div className="my-4">
        <Label htmlFor="role">Role</Label>
        <RoleDropdown
          value={userInput.roleId}
          setValue={(v) => {
            onChangeInput("roleId", v);
          }}
        />
      </div>
      {/* <div className="my-4">
        <Label htmlFor="role">Warehouse</Label>
        <WarehouseDropdown
          value={userInput.warehouseId}
          setValue={(v) => {
            onChangeInput("warehouseId", v);
          }}
        />
      </div> */}
    </div>
  );
}
