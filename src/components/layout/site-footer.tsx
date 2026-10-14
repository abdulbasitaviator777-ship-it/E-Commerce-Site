import Link from "next/link";
import { ShoppingBag, Mail, Phone, MapPin, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { getCategories } from "@/lib/queries/products";
import { getStoreSettings } from "@/lib/settings";

export async function SiteFooter() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getStoreSettings(),
  ]);

  return (
    <footer className="mt-16 border-t border-border bg-surface-muted">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Trust indicators */}
        <div className="mb-10 grid grid-cols-1 gap-4 border-b border-border pb-8 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Fast, tracked delivery</p>
              <p className="text-xs text-muted">Nationwide shipping</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Secure checkout</p>
              <p className="text-xs text-muted">Encrypted &amp; protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Easy returns</p>
              <p className="text-xs text-muted">14-day return policy</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold">{settings.storeName}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Premium clothing, footwear and accessories — curated for everyday
              style and delivered with care.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {settings.addressLine}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-foreground">
                  {settings.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <a href={`tel:${settings.supportPhone}`} className="hover:text-foreground">
                  {settings.supportPhone}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Shop">
            <h3 className="text-sm font-semibold">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/products" className="hover:text-foreground">
                  All Products
                </Link>
              </li>
              {categories.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className="hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/about" className="hover:text-foreground">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">FAQ</Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-foreground">Track Order</Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/shipping-returns" className="hover:text-foreground">Shipping &amp; Returns</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p>Secure payments · Cash on Delivery available</p>
        </div>
      </div>
    </footer>
  );
}
