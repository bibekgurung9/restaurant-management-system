import React from "react";

type IconButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  onClick?: () => void;
  title?: string;
};

export default function IconButton({
  children,
  variant = "primary",
  onClick,
  title,
}: IconButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg h-9 w-9 transition-all active:scale-95 shadow-sm";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    danger: "bg-tertiary text-white hover:bg-tertiary/80",
    ghost: "bg-secondary text-gray-700 hover:bg-secondary/80",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}