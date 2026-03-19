import classNames from "classnames";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "soft";
};

const Card = ({ tone = "default", className, ...props }: CardProps) => {
  const toneClass = tone === "soft" ? "app-card-soft" : "app-card";
  return <div className={classNames(toneClass, className)} {...props} />;
};

export default Card;
