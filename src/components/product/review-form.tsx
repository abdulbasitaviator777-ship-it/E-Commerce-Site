"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { submitReviewAction } from "@/server/actions/review";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  initialRating = 0,
}: {
  productId: string;
  initialRating?: number;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast({ title: "Pick a star rating", variant: "destructive" });
      return;
    }
    setLoading(true);
    const res = await submitReviewAction({ productId, rating, title, body });
    setLoading(false);
    if (res.ok) {
      toast({ title: "Review submitted", description: res.message, variant: "success" });
      setRating(0);
      setTitle("");
      setBody("");
    } else {
      toast({ title: "Could not submit", description: res.message, variant: "destructive" });
    }
  }

  const preview = hovered || rating;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="review-rating" className="mb-2 block">
          Your rating
        </Label>
        <div
          id="review-rating"
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Rating"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  preview >= value ? "fill-star text-star" : "text-border",
                )}
                aria-hidden="true"
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted">{rating} of 5</span>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="review-title" className="mb-2 block">
          Title <span className="font-normal text-muted">(optional)</span>
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sums it up in a few words"
          maxLength={120}
        />
      </div>

      <div>
        <Label htmlFor="review-body" className="mb-2 block">
          Your review
        </Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike? How was the fit and quality?"
          rows={4}
          required
          minLength={3}
          maxLength={2000}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit review
      </Button>
    </form>
  );
}
