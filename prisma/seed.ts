import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateShortId } from "../src/lib/qr";
import { detectAllergens } from "../src/lib/allergens";

const prisma = new PrismaClient();

// Seeds the exact sample data used throughout the design spec (Meridian
// Diner, Downtown/Uptown locations, the sample menu items) so a fresh
// clone shows a populated dashboard instead of an empty one. Run with
// `npm run prisma:seed`.
async function main() {
  const email = "demo@allergenly.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo account already seeded:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("Password123", 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, name: "Meridian Owner", role: "OWNER" },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: user.id,
      name: "Meridian Diner",
      slug: "meridian-diner",
      contactEmail: "hello@meridiandiner.example",
    },
  });

  const [downtown, uptown, midtown] = await Promise.all([
    prisma.location.create({ data: { restaurantId: restaurant.id, name: "Downtown Location" } }),
    prisma.location.create({ data: { restaurantId: restaurant.id, name: "Uptown Location" } }),
    prisma.location.create({ data: { restaurantId: restaurant.id, name: "Midtown Location" } }),
  ]);

  const menu = await prisma.menu.create({
    data: { restaurantId: restaurant.id, locationId: downtown.id, name: "Main Menu", status: "PUBLISHED" },
  });

  const sampleItems: {
    name: string;
    description: string;
    priceCents: number;
    category: "STARTERS" | "MAINS" | "DESSERTS";
  }[] = [
    { name: "Garden Herb Salad", description: "Mixed greens, herb vinaigrette, shaved radish", priceCents: 1200, category: "STARTERS" },
    { name: "Miso Soup", description: "Tofu, scallion, soy broth", priceCents: 700, category: "STARTERS" },
    { name: "Grilled Salmon Bowl", description: "Salmon, jasmine rice, shrimp chili crisp, pickled vegetables", priceCents: 1800, category: "MAINS" },
    { name: "Truffle Mac & Cheese", description: "Cavatappi, three-cheese sauce, breadcrumb, truffle oil", priceCents: 1400, category: "MAINS" },
    { name: "Thai Green Curry", description: "Prawns, peanuts, coconut curry, jasmine rice", priceCents: 1600, category: "MAINS" },
    { name: "Classic Beef Burger", description: "Beef patty, cheddar, brioche bun, fried egg, aioli", priceCents: 1500, category: "MAINS" },
    { name: "Flourless Chocolate Cake", description: "Dark chocolate, whipped cream, butter custard", priceCents: 900, category: "DESSERTS" },
    { name: "Seasonal Fruit Sorbet", description: "Rotating seasonal fruit, mint", priceCents: 700, category: "DESSERTS" },
  ];

  for (const [index, sample] of sampleItems.entries()) {
    const item = await prisma.menuItem.create({
      data: { menuId: menu.id, sortOrder: index, ...sample },
    });

    const matches = detectAllergens(`${sample.name} ${sample.description}`);
    for (const match of matches) {
      await prisma.allergenFlag.create({
        data: { menuItemId: item.id, allergen: match.allergen, status: "AUTO_DETECTED", source: "ocr" },
      });
    }
  }

  // Manually confirm/clear a couple of allergens to populate the
  // dashboard's compliance score with something realistic.
  const salmon = await prisma.menuItem.findFirstOrThrow({ where: { menuId: menu.id, name: "Grilled Salmon Bowl" } });
  const salmonFlags = await prisma.allergenFlag.findMany({ where: { menuItemId: salmon.id } });
  for (const flag of salmonFlags) {
    await prisma.allergenFlag.update({
      where: { id: flag.id },
      data: { status: "CONFIRMED", source: "manual", confirmedById: user.id, confirmedAt: new Date() },
    });
  }

  const macAndCheese = await prisma.menuItem.findFirstOrThrow({ where: { menuId: menu.id, name: "Truffle Mac & Cheese" } });
  const macFlag = await prisma.allergenFlag.findFirst({ where: { menuItemId: macAndCheese.id, allergen: "MILK" } });
  if (macFlag) {
    await prisma.allergenFlag.update({
      where: { id: macFlag.id },
      data: { status: "CONFIRMED", source: "manual", confirmedById: user.id, confirmedAt: new Date() },
    });
  }

  // QR codes per location + some scan history.
  const qrDefs = [
    { location: downtown, label: "Table Menu" },
    { location: uptown, label: "Front Door" },
    { location: midtown, label: "Flyer" },
  ];
  const qrCodes = [];
  for (const def of qrDefs) {
    let shortId = generateShortId();
    // eslint-disable-next-line no-await-in-loop
    while (await prisma.qRCode.findUnique({ where: { shortId } })) shortId = generateShortId();
    // eslint-disable-next-line no-await-in-loop
    const qr = await prisma.qRCode.create({
      data: { shortId, restaurantId: restaurant.id, locationId: def.location.id, menuId: menu.id, label: def.label },
    });
    qrCodes.push(qr);
  }

  const now = Date.now();
  const scanEvents = [];
  for (let day = 0; day < 84; day++) {
    const scansThatDay = Math.floor(Math.random() * 12);
    for (let i = 0; i < scansThatDay; i++) {
      const qr = qrCodes[Math.floor(Math.random() * qrCodes.length)];
      scanEvents.push({
        qrCodeId: qr.id,
        timestamp: new Date(now - day * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000),
        deviceType: Math.random() > 0.3 ? "mobile" : "desktop",
      });
    }
  }
  await prisma.scanEvent.createMany({ data: scanEvents });

  await prisma.activityEvent.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        type: "ALLERGEN_FLAGGED",
        title: "New allergen flagged",
        description: "Shellfish detected in 'Thai Green Curry'",
      },
      {
        restaurantId: restaurant.id,
        type: "MENU_UPDATED",
        title: "Menu updated",
        description: "Downtown location — 4 items edited",
      },
      {
        restaurantId: restaurant.id,
        type: "QR_GENERATED",
        title: "QR code generated",
        description: "Uptown location — table menus",
      },
      {
        restaurantId: restaurant.id,
        type: "ALLERGEN_CONFIRMED",
        title: "Allergen confirmed",
        description: "Dairy verified in 'Truffle Mac & Cheese'",
      },
    ],
  });

  console.log("Seeded demo account:");
  console.log("  email:   demo@allergenly.app");
  console.log("  password: Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
