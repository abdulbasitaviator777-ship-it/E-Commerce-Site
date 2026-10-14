import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Ayesha K.",
    city: "Lahore",
    rating: 5,
    text: "The quality exceeded my expectations. Delivery was quick and the packaging felt premium. NovaStore is now my go-to for everyday wear.",
  },
  {
    name: "Bilal M.",
    city: "Karachi",
    rating: 5,
    text: "Ordered a jacket and shoes — both fit exactly as the size guide said. Easy returns process too, though I didn't need it.",
  },
  {
    name: "Sana R.",
    city: "Islamabad",
    rating: 4,
    text: "Great collection and fair prices. Customer support answered my question within an hour. Will definitely order again.",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-border bg-surface-muted py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Loved by thousands
          </h2>
          <p className="mt-1 text-sm text-muted">
            Real reviews from real customers
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-1 text-warning" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={
                      i < t.rating ? "h-4 w-4 fill-warning" : "h-4 w-4 text-muted"
                    }
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-sm text-muted">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-medium">
                {t.name}
                <span className="ml-2 font-normal text-muted">· {t.city}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
