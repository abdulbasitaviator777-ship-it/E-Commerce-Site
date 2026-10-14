import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-soft via-background to-background" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            New season · New arrivals
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Everyday style,
            <br />
            <span className="text-accent">effortlessly yours.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-muted sm:text-lg">
            Discover premium clothing, footwear and accessories designed to
            last. Secure checkout and fast delivery across Pakistan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/products">
                Shop now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products?sort=newest">View new arrivals</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <dt className="text-xs text-muted">Happy customers</dt>
              <dd className="text-lg font-bold">10k+</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Products</dt>
              <dd className="text-lg font-bold">500+</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">On-time delivery</dt>
              <dd className="text-lg font-bold">98%</dd>
            </div>
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23eef2ff'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='28' fill='%234f46e5' text-anchor='middle' dominant-baseline='middle'%3ENew Season%3C/text%3E%3C/svg%3E"
              alt="Featured collection"
              className="aspect-[4/5] w-full rounded-xl object-cover shadow-lg"
            />
            <div className="grid gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='100%25' height='100%25' fill='%23fce7f3'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%23be185d' text-anchor='middle' dominant-baseline='middle'%3EWomen%3C/text%3E%3C/svg%3E"
                alt="Women's collection"
                className="aspect-square w-full rounded-xl object-cover shadow-lg"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='100%25' height='100%25' fill='%23dbeafe'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%231d4ed8' text-anchor='middle' dominant-baseline='middle'%3EMen%3C/text%3E%3C/svg%3E"
                alt="Men's collection"
                className="aspect-square w-full rounded-xl object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
