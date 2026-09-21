"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";
import useValidation from "@/src/hooks/use-validation";
import { FetchError } from "@/src/libs/fetch-error";
import { validateSetupFormData } from "@/src/libs/validation/auth-validations";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import { useToast } from "@/src/providers/ToastProvider";

export default function SetupPage() {
  const router = useRouter();
  const { fetchData } = useFetch();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { validate, errorMessage, setErrors, revalidateOnError } =
    useValidation(validateSetupFormData);

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

      router.replace("/");
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
        toast.error("Failed to create account. Please try again.");
      }
    }
  }

  return (
    <main className="container-main h-full w-full flex items-center justify-center">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md border border-stone-200">
        <H1 className="text-center mb-2">Setup</H1>
        <p className="text-center text-default-500 text-sm mb-6">
          Set up your username and password to get started.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <Input
            id="username"
            label="Username"
            autoComplete="username"
            value={formData.username}
            onChange={(value) => setFormData({ ...formData, username: value })}
            isDisabled={loading}
            error={errorMessage("username")}
            validate={(value) => revalidateOnError("username", value)}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="password"
            value={formData.password}
            onChange={(value) => setFormData({ ...formData, password: value })}
            isDisabled={loading}
            error={errorMessage("password")}
            validate={(value) => revalidateOnError("password", value)}
          />

          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={formData.confirmPassword}
            onChange={(value) =>
              setFormData({ ...formData, confirmPassword: value })
            }
            autoComplete="password"
            isDisabled={loading}
            error={errorMessage("confirmPassword")}
            validate={(value) => revalidateOnError("confirmPassword", value)}
          />

          <Button
            type="submit"
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
