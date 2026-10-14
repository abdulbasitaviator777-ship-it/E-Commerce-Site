import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

interface PriceProps {
  minor: number;
  saleMinor?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Price({
  minor,
  saleMinor,
  currency = "PKR",
  size = "md",
  className,
}: PriceProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };
  const onSale = saleMinor != null && saleMinor < minor && saleMinor >= 0;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-semibold", sizes[size], onSale && "text-danger")}>
        {formatMoney(onSale ? saleMinor : minor, currency)}
      </span>
      {onSale && (
        <span
          className={cn(
            "text-muted line-through",
            size === "lg" ? "text-base" : "text-xs",
          )}
        >
          {formatMoney(minor, currency)}
        </span>
      )}
    </div>
  );
}
