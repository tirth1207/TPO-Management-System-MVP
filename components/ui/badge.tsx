import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/15 px-2 py-0.5 text-xs text-black/80",
        className
      )}
      {...props}
    />
  );
}
