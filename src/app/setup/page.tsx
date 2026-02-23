"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";

export default function SetupPage() {
  const router = useRouter();
  const { fetchData } = useFetch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const nextErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      nextErrors.username = "Username is required";
    }
    if (!formData.password) {
      nextErrors.password = "Password is required";
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await fetchData("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
        setIsLoading: setLoading,
      });

      router.push("/");
      router.refresh();
    } catch {
      setErrors({ submit: "Failed to create account. Please try again." });
    }
  }

  return (
    <main className="h-full w-full flex items-center justify-center bg-stone-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md border border-stone-200">
        <H1 className="text-center mb-2">Create your account</H1>
        <p className="text-center text-default-500 text-sm mb-6">
          Set up your username and password to get started.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onValueChange={(value) => {
              setFormData({ ...formData, username: value });
              clearError("username");
            }}
            autoComplete="username"
            isRequired
            isDisabled={loading}
            isInvalid={!!errors.username}
            errorMessage={errors.username}
            autoFocus
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onValueChange={(value) => {
              setFormData({ ...formData, password: value });
              clearError("password");
              clearError("confirmPassword");
            }}
            autoComplete="new-password"
            isRequired
            isDisabled={loading}
            isInvalid={!!errors.password}
            errorMessage={errors.password}
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onValueChange={(value) => {
              setFormData({ ...formData, confirmPassword: value });
              clearError("confirmPassword");
              clearError("password");
            }}
            autoComplete="new-password"
            isRequired
            isDisabled={loading}
            isInvalid={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
          />

          {errors.submit && (
            <p className="text-sm text-danger" role="alert">
              {errors.submit}
            </p>
          )}

          <Button
            type="submit"
            color="primary"
            isLoading={loading}
            isDisabled={loading}
            className="mt-2"
          >
            Create account
          </Button>
        </form>
      </div>
    </main>
  );
}
