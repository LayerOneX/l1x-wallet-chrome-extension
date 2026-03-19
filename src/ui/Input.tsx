import classNames from "classnames";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

const Input = ({ label, hint, className, ...props }: InputProps) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-txt-muted text-[10px] uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <input
        className={classNames(
          "app-input w-full placeholder:text-txt-muted",
          props.disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      />
      {hint && <p className="text-[10px] text-txt-muted mt-1">{hint}</p>}
    </div>
  );
};

export default Input;
