import { Truck, ShieldCheck, Headphones, BadgePercent } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Free shipping",
    text: "On orders over Rs 15,000",
  },
  {
    icon: BadgePercent,
    title: "Member discounts",
    text: "Exclusive deals for subscribers",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    text: "Your data is always protected",
  },
  {
    icon: Headphones,
    title: "Dedicated support",
    text: "We're here 7 days a week",
  },
];

export function FeatureStrip() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              <f.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
