import { type ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "md" | "sm";
  variant?: "plastic" | "ghost";
  icon?: boolean;
}

export default function Button({
  size = "md",
  variant = "plastic",
  icon = false,
  className = "",
  ...props
}: Props) {
  const cls = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    icon && "btn--icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={cls} {...props} />;
}
