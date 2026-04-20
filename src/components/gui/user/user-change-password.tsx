import { useMutationChangePassword } from "@/app/hooks/use-query-user";
import { createDialog } from "@/components/create-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderIcon,
  Lock,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export const userChangePassword = createDialog<unknown, unknown>(
  ({ close }) => {
    const { isMutating, trigger } = useMutationChangePassword();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordValidation = useMemo<PasswordValidation>(() => {
      return {
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      };
    }, [newPassword]);

    const passwordStrength = useMemo(() => {
      const validations =
        Object.values(passwordValidation).filter(Boolean).length;
      if (validations === 0) return { label: "", color: "" };
      if (validations <= 2) return { label: "Weak", color: "text-red-500" };
      if (validations <= 4)
        return { label: "Medium", color: "text-yellow-500" };
      return { label: "Strong", color: "text-green-500" };
    }, [passwordValidation]);

    const isPasswordMatch = useMemo(() => {
      return confirmPassword && newPassword === confirmPassword;
    }, [newPassword, confirmPassword]);

    const isFormValid = useMemo(() => {
      return (
        oldPassword.trim() !== "" &&
        newPassword.trim() !== "" &&
        isPasswordMatch
      );
    }, [oldPassword, newPassword, isPasswordMatch]);

    const handleSubmit = useCallback(() => {
      if (!isFormValid) {
        toast.error("Please check all requirements");
        return;
      }

      trigger({ oldPassword, newPassword })
        .then((res) => {
          if (res.success === false) {
            toast.error(res.error || "Failed to change password");
            return;
          }
          toast.success("Password changed successfully");
          close(true);
        })
        .catch((error) => {
          toast.error(error.message ?? "Failed to change password");
        });
    }, [isFormValid, trigger, oldPassword, newPassword, close]);

    const ValidationItem = ({
      valid,
      text,
    }: {
      valid: boolean;
      text: string;
    }) => (
      <div className="flex items-center gap-2 text-sm">
        {valid ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span
          className={cn(valid ? "text-green-600" : "text-muted-foreground")}
        >
          {text}
        </span>
      </div>
    );

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new secure password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="old-password">Current Password</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOldPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isMutating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showOldPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isMutating}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {newPassword && (
              <div className="text-sm font-medium">
                Password Strength:{" "}
                <span className={passwordStrength.color}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Password must contain:</p>
              <div className="space-y-1.5">
                <ValidationItem
                  valid={passwordValidation.minLength}
                  text="At least 8 characters"
                />
                <ValidationItem
                  valid={passwordValidation.hasUpperCase}
                  text="One uppercase letter"
                />
                <ValidationItem
                  valid={passwordValidation.hasLowerCase}
                  text="One lowercase letter"
                />
                <ValidationItem
                  valid={passwordValidation.hasNumber}
                  text="One number"
                />
                <ValidationItem
                  valid={passwordValidation.hasSpecialChar}
                  text="One special character (!@#$%^&*...)"
                />
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isMutating}
                className={cn(
                  "pr-10",
                  confirmPassword &&
                    (isPasswordMatch
                      ? "border-green-500 focus-visible:ring-green-500"
                      : "border-red-500 focus-visible:ring-red-500")
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword && !isPasswordMatch && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
            {confirmPassword && isPasswordMatch && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Passwords match
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(undefined)}
            disabled={isMutating}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isMutating}>
            {isMutating && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </DialogFooter>
      </>
    );
  },
  { defaultValue: undefined }
);
