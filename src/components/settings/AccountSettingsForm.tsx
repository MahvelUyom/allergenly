"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { accountSettingsSchema } from "@/lib/zod-schemas";

interface AccountSettingsFormProps {
  initial: { name: string; email: string; hasPassword: boolean; googleConnected: boolean };
}

export function AccountSettingsForm({ initial }: AccountSettingsFormProps) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setFormError(null);

    const payload = {
      name,
      email,
      ...(newPassword && { currentPassword, newPassword }),
    };
    const parsed = accountSettingsSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    const res = await fetch("/api/settings/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error || "Something went wrong");
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-h3 text-charcoal">Account settings</h3>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <Input id="name" label="Your name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {initial.hasPassword ? (
          <>
            <Input
              id="currentPassword"
              type="password"
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.currentPassword}
              helperText="Only required if you're setting a new password"
            />
            <Input
              id="newPassword"
              type="password"
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={errors.newPassword}
            />
          </>
        ) : (
          <p className="text-micro text-charcoal/56">
            {initial.googleConnected
              ? "Signed in with Google — no password on this account."
              : "No password set."}
          </p>
        )}

        {formError && <p className="text-micro text-danger">{formError}</p>}

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
