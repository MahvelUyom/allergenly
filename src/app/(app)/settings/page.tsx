import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session!.user.restaurantId!;
  const userId = session!.user.id;

  const [restaurant, user, googleAccount] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.account.findFirst({ where: { userId, provider: "google" } }),
  ]);

  return (
    <div>
      <AppHeader title="Settings" subtitle="Manage your restaurant profile and account." />

      <div className="flex flex-col gap-6">
        <ProfileSettingsForm
          initial={{
            name: restaurant.name,
            contactEmail: restaurant.contactEmail ?? "",
            contactPhone: restaurant.contactPhone ?? "",
          }}
        />
        <AccountSettingsForm
          initial={{
            name: user.name ?? "",
            email: user.email,
            hasPassword: !!user.passwordHash,
            googleConnected: !!googleAccount,
          }}
        />
      </div>
    </div>
  );
}
