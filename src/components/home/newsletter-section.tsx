import { NewsletterForm } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-accent-soft to-background px-6 py-10 text-center sm:px-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Get 10% off your first order
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Subscribe to our newsletter for exclusive deals, new arrivals and
          style inspiration. Use code <strong>WELCOME10</strong> at checkout.
        </p>
        <div className="mt-6 flex justify-center">
          <NewsletterForm />
        </div>
        <p className="mt-3 text-xs text-muted">
          No spam, unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
