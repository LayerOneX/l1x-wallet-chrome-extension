import classNames from "classnames";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const Button = ({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: ButtonProps) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors";

  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary px-4 py-3",
    secondary: "btn-secondary px-4 py-3",
    tertiary: "btn-tertiary px-4 py-3",
    ghost: "text-txt-secondary hover:text-white px-3 py-2",
    danger:
      "bg-accent-red text-white px-4 py-3 hover:bg-accent-red/90",
  };

  return (
    <button
      className={classNames(
        base,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
};

export default Button;
