import { prisma } from "./prisma";
import type { BarDatum } from "@/components/ui/BarChart";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Scans for the current Mon–Sun week, peak day highlighted — for the QR Code Management "Scan analytics" card. */
export async function getWeeklyScansByDay(qrCodeId: string): Promise<{ data: BarDatum[]; total: number }> {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const events = await prisma.scanEvent.findMany({
    where: { qrCodeId, timestamp: { gte: monday } },
    select: { timestamp: true },
  });

  const counts = new Array(7).fill(0);
  for (const e of events) {
    const diffDays = Math.floor((e.timestamp.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) counts[diffDays] += 1;
  }

  const max = Math.max(...counts);
  const data: BarDatum[] = DAY_LABELS.map((label, i) => ({
    label,
    value: counts[i],
    highlight: counts[i] === max && max > 0,
  }));

  const total = await prisma.scanEvent.count({ where: { qrCodeId } });

  return { data, total };
}

/** Per-QR-code scan breakdown for the Analytics page — combined total isn't the whole story per the build spec. */
export async function getScanBreakdownByQrCode(restaurantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const qrCodes = await prisma.qRCode.findMany({
    where: { restaurantId },
    include: { location: true },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    qrCodes.map(async (qr) => {
      const [total, thisMonth] = await Promise.all([
        prisma.scanEvent.count({ where: { qrCodeId: qr.id } }),
        prisma.scanEvent.count({ where: { qrCodeId: qr.id, timestamp: { gte: startOfMonth } } }),
      ]);
      return {
        id: qr.id,
        label: qr.label,
        locationName: qr.location?.name ?? "All locations",
        total,
        thisMonth,
      };
    })
  );
}
