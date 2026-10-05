import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShortId, renderQrCodeDataUrl, publicMenuUrl } from "@/lib/qr";
import { getWeeklyScansByDay } from "@/lib/qr-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { QRPreviewCard } from "@/components/qr/QRPreviewCard";
import { ScanAnalyticsCard } from "@/components/qr/ScanAnalyticsCard";
import { LocationSwitcher } from "@/components/qr/LocationSwitcher";

export const metadata: Metadata = { title: "QR Code Management", robots: { index: false } };

async function ensureDefaultQrCode(restaurantId: string) {
  const existing = await prisma.qRCode.findFirst({ where: { restaurantId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  const [menu, location] = await Promise.all([
    prisma.menu.findFirst({ where: { restaurantId }, orderBy: { createdAt: "asc" } }),
    prisma.location.findFirst({ where: { restaurantId }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!menu) return null;

  let shortId = generateShortId();
  while (await prisma.qRCode.findUnique({ where: { shortId } })) shortId = generateShortId();

  return prisma.qRCode.create({
    data: {
      shortId,
      restaurantId,
      menuId: menu.id,
      locationId: location?.id,
      label: "Table Menu",
    },
  });
}

export default async function QrCodesPage({ searchParams }: { searchParams: { id?: string } }) {
  const session = await getServerSession(authOptions);
  const restaurantId = session!.user.restaurantId!;

  // The restaurant row doesn't depend on the default-QR-code check, so
  // it runs alongside it instead of after — one fewer sequential round
  // trip before the page can render.
  const [restaurant] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
    ensureDefaultQrCode(restaurantId),
  ]);

  const qrCodes = await prisma.qRCode.findMany({
    where: { restaurantId },
    include: { location: true },
    orderBy: { createdAt: "asc" },
  });

  const active = qrCodes.find((q) => q.id === searchParams.id) ?? qrCodes[0];

  if (!active) {
    return (
      <div>
        <AppHeader title="QR Code Management" />
        <p className="text-body text-charcoal/70">Upload a menu first to generate a QR code.</p>
      </div>
    );
  }

  const [dataUrl, scanStats] = await Promise.all([
    renderQrCodeDataUrl(active.shortId, { color: active.color, background: active.background }),
    getWeeklyScansByDay(active.id),
  ]);

  const locationLabel = active.location?.name ?? "All locations";

  return (
    <div>
      <AppHeader
        title="QR Code Management"
        subtitle={`${locationLabel} · ${active.label}`}
        rightSlot={
          <LocationSwitcher
            activeId={active.id}
            options={qrCodes.map((q) => ({ id: q.id, label: `${q.location?.name ?? "All locations"} · ${q.label}` }))}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <QRPreviewCard
          dataUrl={dataUrl}
          caption={`${active.label} — ${locationLabel}`}
          displayUrl={publicMenuUrl(restaurant.slug).replace(/^https?:\/\//, "")}
        />
        <ScanAnalyticsCard data={scanStats.data} total={scanStats.total} />
      </div>
    </div>
  );
}
