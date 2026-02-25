"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";
import { FetchError } from "@/src/libs/fetch-error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchData } = useFetch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
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

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await fetchData("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        setIsLoading: setLoading,
      });

      const from = searchParams.get("from");
      router.push(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof FetchError &&
        err.data &&
        typeof err.data === "object" &&
        "error" in err.data &&
        typeof (err.data as { error: string }).error === "string"
          ? (err.data as { error: string }).error
          : "Invalid username or password";
      setErrors({ submit: message });
    }
  }

  return (
    <main className="h-full w-full flex items-center justify-center bg-stone-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md border border-stone-200">
        <H1 className="text-center mb-6">Sign in</H1>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
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
            }}
            autoComplete="current-password"
            isRequired
            isDisabled={loading}
            isInvalid={!!errors.password}
            errorMessage={errors.password}
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
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
