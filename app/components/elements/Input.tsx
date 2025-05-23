import { FormEventHandler } from "react";

const Input = ({
  label = "",
  value = "",
  name = "",
  onChange = () => {},
}: {
  label?: string;
  value?: string;
  name?: string;
  onChange?: FormEventHandler<HTMLInputElement>;
}) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={name}>{label}</label>
      <input value={value} name={name} onChange={onChange} />
    </div>
  );
};

export default Input;
