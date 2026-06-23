import React from "react";

type ActionButtonProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function ActionButton({
  icon,
  children,
  className = "",
}: ActionButtonProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2

        px-4 py-2.5
        rounded-xl

        bg-primary text-white
        text-sm font-medium

        shadow-[0_1px_2px_rgba(0,0,0,0.08)]

        transition-all duration-200 ease-out

        hover:-translate-y-[1px]
        hover:shadow-[0_8px_18px_rgba(0,0,0,0.12)]
        hover:opacity-95

        active:translate-y-0 active:scale-[0.98]

        focus:outline-none focus:ring-2 focus:ring-primary/40

        cursor-pointer select-none

        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{children}</span>
    </div>
  );
}