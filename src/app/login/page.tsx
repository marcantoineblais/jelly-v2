"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Logo from "@/src/assets/img/logo.png";
import H1 from "@/src/components/elements/H1";
import useFetch from "@/src/hooks/use-fetch";
import useValidation from "@/src/hooks/use-validation";
import { FetchError } from "@/src/libs/fetch-error";
import { validateLoginFormData } from "@/src/libs/validation/auth-validations";
import Input from "@/src/components/ui/Input";
import Button from "@/src/components/ui/Button";
import PasswordInput from "@/src/components/ui/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchData } = useFetch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { validate, errorMessage, setError, setErrors, revalidateOnError } =
    useValidation(validateLoginFormData);

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
    <main className="container-main h-full w-full flex items-center justify-center p-4">
      <div className="w-full max-w-sm card rounded-3xl p-7 animate-fade-in-up">
        <div className="flex justify-center mb-5">
          <span className="relative size-16 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-glow">
            <Image
              src={Logo}
              alt="Jelly"
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </span>
        </div>
        <H1 className="w-full text-center">Sign in</H1>
        <p className="text-center text-text-muted text-sm mt-1 mb-8">
          Welcome back to Jelly
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <Input
            id="username"
            label="Username"
            value={formData.username}
            onChange={(value) => setFormData({ ...formData, username: value })}
            autoComplete="username"
            isRequired
            isDisabled={loading}
            error={errorMessage("username")}
            validate={(value) => revalidateOnError("username", value)}
          />

          <PasswordInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={(value) => {
              setFormData({ ...formData, password: value });
              revalidateOnError("password", value);
            }}
            autoComplete="current-password"
            isRequired
            isDisabled={loading}
            error={errorMessage("password")}
            validate={(value) => revalidateOnError("password", value)}
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
            className="mt-2"
          >
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
