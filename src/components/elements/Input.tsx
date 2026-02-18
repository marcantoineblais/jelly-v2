import { FormEventHandler } from "react";

export default function Input({
  label = "",
  value = "",
  name = "",
  onChange = () => {},
}: {
  label?: string;
  value?: string;
  name?: string;
  onChange?: FormEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name}>{label}</label>
      <input value={value} name={name} onChange={onChange} />
    </div>
  );
}
