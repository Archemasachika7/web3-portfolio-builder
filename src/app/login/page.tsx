"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setErrors(prev => ({ ...prev, password: "Password is required" }));
      setIsLoading(false);
      return;
    }

    const { data, error } = await authClient.signIn.email({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
      callbackURL: "/"
    });

    if (error?.code) {
      toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
      setIsLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card rounded-lg border border-border p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-heading mb-1 text-card-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to your portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="mt-1"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="off"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="mt-1"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, rememberMe: Boolean(checked) }))
                }
              />
              <Label htmlFor="rememberMe">Remember me</Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create a new account
          </Link>
        </p>
      </div>
    </div>
  );
}