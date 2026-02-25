const validateUsername = (username: unknown) => {
  if (typeof username !== "string") return "Username is required";
  if (!username.trim()) return "Username is required";
  return null;
};

const validatePassword = (password: unknown) => {
  if (typeof password !== "string") return "Password is required";
  if (!password) return "Password is required";
  return null;
};

const validateConfirmPassword = (
  confirmPassword: unknown,
  password: unknown,
) => {
  if (password === undefined) return null;
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return "Confirm password is required";
  }
  if (typeof password !== "string") return "Password is required";
  if (password !== confirmPassword) return "Passwords do not match";
  return null;
};

const loginValidationsMap: Record<string, (value: unknown) => string | null> = {
  username: validateUsername,
  password: validatePassword,
};

const setupValidationsMap: Record<
  string,
  (value: unknown, data: Record<string, unknown>) => string | null
> = {
  username: (value) => validateUsername(value),
  password: (value) => validatePassword(value),
  confirmPassword: (value, data) =>
    validateConfirmPassword(value, data.password),
};

export function validateLoginFormData(data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    const validate = loginValidationsMap[key];
    if (!validate) return;
    const error = validate(value);
    if (error) errors[key] = error;
  });
  return errors;
}

export function validateSetupFormData(data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    const validate = setupValidationsMap[key];
    if (!validate) return;
    const error = validate(value, data);
    if (error) errors[key] = error;
  });
  return errors;
}
