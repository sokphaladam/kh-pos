import { useMutationResetPassword } from "@/app/hooks/use-query-user";
import { createDialog } from "@/components/create-dialog";
import LabelInput from "@/components/label-input";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export const userResetPassword = createDialog<{ userId: string }, unknown>(
  ({ close, userId }) => {
    const { trigger, isMutating } = useMutationResetPassword();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({
      newPassword: "",
      confirmPassword: "",
    });

    const validateForm = () => {
      const newErrors = {
        newPassword: "",
        confirmPassword: "",
      };

      if (!newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      setErrors(newErrors);
      return !newErrors.newPassword && !newErrors.confirmPassword;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        const result = await trigger({ newPassword, userId });
        if (result?.success) {
          toast.success("Password reset successfully");
          setNewPassword("");
          setConfirmPassword("");
          setErrors({ newPassword: "", confirmPassword: "" });
          close(true);
        } else {
          toast.error(result?.error || "Failed to reset password");
        }
      } catch (error) {
        toast.error("An error occurred while resetting password");
        console.error(error);
      }
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <LabelInput
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: "" });
                  }
                }}
                placeholder="Enter new password"
                required
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.newPassword}
                </p>
              )}
            </div>
            <div>
              <LabelInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: "" });
                  }
                }}
                placeholder="Confirm new password"
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </>
    );
  },
  { defaultValue: null }
);
