"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";
import useValidation from "@/src/hooks/use-validation";
import { FetchError } from "@/src/libs/fetch-error";
import { validateLoginFormData } from "@/src/libs/validation/auth-validations";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchData } = useFetch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const {
    validate,
    isInvalid,
    errorMessage,
    setError,
    setErrors,
    revalidateOnError,
  } = useValidation(validateLoginFormData);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasErrors = validate(formData);
    if (hasErrors) return;

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
      if (
        err instanceof FetchError &&
        err.data &&
        typeof err.data === "object"
      ) {
        const data = err.data as { error?: unknown; errors?: unknown };
        if (data.errors && typeof data.errors === "object") {
          setErrors(data.errors as Record<string, string>);
        }
        setError(
          "submit",
          typeof data.error === "string"
            ? data.error
            : "Invalid username or password",
        );
        return;
      }
      setError("submit", "Invalid username or password");
    }
  }

  return (
    <main className="container-main h-full w-full flex items-center justify-center">
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
              revalidateOnError("username", value);
            }}
            autoComplete="username"
            isRequired
            isDisabled={loading}
            isInvalid={isInvalid("username")}
            errorMessage={errorMessage("username")}
            autoFocus
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onValueChange={(value) => {
              setFormData({ ...formData, password: value });
              revalidateOnError("password", value);
            }}
            autoComplete="current-password"
            isRequired
            isDisabled={loading}
            isInvalid={isInvalid("password")}
            errorMessage={errorMessage("password")}
          />

          {errorMessage("submit") && (
            <p className="text-sm text-danger" role="alert">
              {errorMessage("submit")}
            </p>
          )}

          <Button
            type="submit"
            color="primary"
            isLoading={loading}
            isDisabled={loading}
            className="mt-2 shadow-btn"
          >
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
