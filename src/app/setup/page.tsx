"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";
import useValidation from "@/src/hooks/use-validation";
import { FetchError } from "@/src/libs/fetch-error";
import { validateSetupFormData } from "@/src/libs/validation/auth-validations";

export default function SetupPage() {
  const router = useRouter();
  const { fetchData } = useFetch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const {
    validate,
    isInvalid,
    errorMessage,
    setError,
    setErrors,
    revalidateOnError,
  } = useValidation(validateSetupFormData);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasErrors = validate(formData);
    if (hasErrors) return;

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
      } else {
        setError("submit", "Failed to create account. Please try again.");
      }
    }
  }

  return (
    <main className="h-full w-full flex items-center justify-center bg-stone-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md border border-stone-200">
        <H1 className="text-center mb-2">Create your account</H1>
        <p className="text-center text-default-500 text-sm mb-6">
          Set up your username and password to get started.
        </p>

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
              setErrors((prev) => {
                if (!prev.confirmPassword) return prev;
                const next = { ...prev };
                delete next.confirmPassword;
                return next;
              });
            }}
            autoComplete="new-password"
            isDisabled={loading}
            isInvalid={isInvalid("password")}
            errorMessage={errorMessage("password")}
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onValueChange={(value) => {
              setFormData({ ...formData, confirmPassword: value });
              revalidateOnError("confirmPassword", value);
            }}
            autoComplete="new-password"
            isDisabled={loading}
            isInvalid={isInvalid("confirmPassword")}
            errorMessage={errorMessage("confirmPassword")}
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
            Create account
          </Button>
        </form>
      </div>
    </main>
  );
}
