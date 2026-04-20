"use client";
import { useMutationFirstUser } from "@/app/hooks/use-query-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  // const router = useRouter();
  const [formData, setFormData] = useState({
    martName: "",
    phoneNumber: "",
    address: "",
    ownerName: "",
    userName: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { trigger, isMutating } = useMutationFirstUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (Object.values(formData).some((value) => !value)) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    trigger({
      ownerName: formData.ownerName,
      warehouseName: formData.martName,
      address: formData.address,
      phoneNumber: formData.phoneNumber,
      userName: formData.userName,
      password: formData.password,
    })
      .then((res) => {
        if (res.success) {
          // clear cookies
          Cookies.remove("session", { path: "/" });
          toast.success(
            "Registration successful! Please login with your credentials."
          );
          if (typeof window !== "undefined") {
            window.location.pathname = "/";
          }
        }
      })
      .catch(() => {
        toast.error("Registration failed. Please try again.");
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Register Your Store
          </CardTitle>
          <CardDescription>
            Create an account to manage your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="martName">Store Name</Label>
                <Input
                  id="martName"
                  name="martName"
                  value={formData.martName}
                  onChange={handleChange}
                  placeholder="Your Store Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    if (
                      e.target.value &&
                      /^[0-9]+$/.test(e.target.value) === false
                    ) {
                      return;
                    }
                    handleChange(e);
                  }}
                  placeholder="Your Phone Number"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ex: Toul Kork, Phnom Penh"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder="Username for login"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isMutating}>
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
