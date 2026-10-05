"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { restaurantProfileSchema } from "@/lib/zod-schemas";

interface ProfileSettingsFormProps {
  initial: { name: string; contactEmail: string; contactPhone: string };
}

export function ProfileSettingsForm({ initial }: ProfileSettingsFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const parsed = restaurantProfileSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
  }

  return (
    <Card className="p-6">
      <h3 className="text-h3 text-charcoal">Restaurant profile</h3>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <Input
          id="name"
          label="Restaurant name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          id="contactEmail"
          type="email"
          label="Contact email"
          value={values.contactEmail}
          onChange={(e) => setValues((v) => ({ ...v, contactEmail: e.target.value }))}
          error={errors.contactEmail}
        />
        <Input
          id="contactPhone"
          label="Contact phone"
          value={values.contactPhone}
          onChange={(e) => setValues((v) => ({ ...v, contactPhone: e.target.value }))}
          error={errors.contactPhone}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-micro text-success">Saved</span>}
        </div>
      </form>
    </Card>
  );
}
