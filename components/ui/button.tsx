"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "h-8 px-3" : "h-10 px-4",
        variant === "default" && "bg-black text-white hover:bg-black/90",
        variant === "outline" &&
          "border border-black/20 bg-white hover:bg-black/5 text-black",
        variant === "ghost" && "hover:bg-black/5 text-black",
        className
      )}
      {...props}
    />
  );
}
