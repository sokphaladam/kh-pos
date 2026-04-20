"use client";
import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useAuthentication } from "../../../../contexts/authentication-context";
import { useCommonDialog } from "@/components/common-dialog";
import { useLogin } from "@/app/hooks/use-query-user";
export default function LoginPage() {
  const { showDialog } = useCommonDialog();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { isMutating, trigger } = useLogin();
  const { login, user } = useAuthentication();

  const handleSubmit = useCallback(async () => {
    const result = await trigger({ username, password });
    if (result.error !== undefined) {
      showDialog({
        title: "Login failed",
        content: result.error,
        destructive: true,
      });
    } else if (result.token) {
      login(result.token);
    }
  }, [username, password, trigger, showDialog, login]);

  if (!!user) return <></>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your username and password to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="mb-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter username"
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isMutating}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
