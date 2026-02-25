import { useCallback, useState } from "react";
import { validateFormData } from "../libs/validation/show-validations";

export default function useValidation(
  validationFunction: (data: Record<string, unknown>) => Record<string, string>,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isInvalid = useCallback(
    (fieldName: string) => {
      return Boolean(errors[fieldName]);
    },
    [errors],
  );

  const errorMessage = useCallback(
    (fieldName: string) => {
      return errors[fieldName] ?? "";
    },
    [errors],
  );

  const setError = useCallback((fieldName: string, error: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  const validate = useCallback((data: Record<string, unknown>) => {
    const newErrors = validationFunction(data);
    const hasErrors = Object.keys(newErrors).length > 0;
    setErrors(newErrors);
    return hasErrors;
  }, [validationFunction]);

  const revalidateOnError = useCallback(
    (fieldName: string, value: unknown) => {
      if (!errors[fieldName]) return;

      const newErrors = validateFormData({ [fieldName]: value });
      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...errors }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    },
    [errors],
  );

  return {
    isInvalid,
    errorMessage,
    setError,
    setErrors,
    revalidateOnError,
    validate,
  };
}
