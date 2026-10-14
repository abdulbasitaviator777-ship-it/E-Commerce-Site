import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number; // 0..5, may be fractional
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
}

export function Stars({
  rating,
  size = "sm",
  showValue = false,
  count,
  className,
}: StarsProps) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  const rounded = Math.round(rating * 2) / 2; // nearest half
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <span key={i} className="relative inline-block">
              <Star
                className={cn(
                  sizes[size],
                  "text-border",
                )}
                strokeWidth={1.5}
              />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star
                    className={cn(sizes[size], "text-star")}
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-muted">
          {rating.toFixed(1)}
          {typeof count === "number" && (
            <span className="text-muted"> ({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
