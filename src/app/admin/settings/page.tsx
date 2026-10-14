import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store settings</h1>
        <p className="mt-1 text-sm text-muted">
          Global configuration for the storefront, taxes and delivery.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
