import { z } from "zod";

// ---------------------------------------------------------------------
// Every schema here is used on BOTH the client (for inline form
// validation/UX) and the server (re-validated on the API route — never
// trust the client). Keep them in this one shared module so the two
// never drift apart.
// ---------------------------------------------------------------------

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password,
  restaurantName: z.string().trim().min(2, "Restaurant name is required").max(120),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms & Conditions" }),
  }),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const allergenEnum = z.enum([
  "GLUTEN",
  "CRUSTACEANS",
  "EGGS",
  "FISH",
  "PEANUTS",
  "SOYBEANS",
  "MILK",
  "NUTS",
  "CELERY",
  "MUSTARD",
  "SESAME",
  "SULPHITES",
  "LUPIN",
  "MOLLUSCS",
]);

export const menuCategoryEnum = z.enum(["STARTERS", "MAINS", "DESSERTS", "DRINKS", "OTHER"]);

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  description: z.string().trim().max(600).optional().default(""),
  priceCents: z.number().int().nonnegative().max(100_000_00).nullable().optional(),
  category: menuCategoryEnum.optional().default("OTHER"),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

// Manual allergen override: staff toggles one allergen for one item to
// either CONFIRMED or CLEARED. (AUTO_DETECTED is only ever set by the
// server-side detection pass, never accepted from the client.)
export const allergenOverrideSchema = z.object({
  menuItemId: z.string().cuid2().or(z.string().min(1)),
  allergen: allergenEnum,
  status: z.enum(["CONFIRMED", "CLEARED"]),
});
export type AllergenOverrideInput = z.infer<typeof allergenOverrideSchema>;

export const restaurantProfileSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name is required").max(120),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  contactPhone: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+()\-.\s]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});
export type RestaurantProfileInput = z.infer<typeof restaurantProfileSchema>;

export const accountSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: password.optional(),
}).refine((data) => !data.newPassword || !!data.currentPassword, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
});
export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;

export const qrCodeCreateSchema = z.object({
  menuId: z.string().min(1),
  locationId: z.string().min(1).optional(),
  label: z.string().trim().min(1).max(80).default("Table Menu"),
});
export type QrCodeCreateInput = z.infer<typeof qrCodeCreateSchema>;

// Upload metadata validated server-side alongside the raw multipart
// file (see /api/menus/upload). Client-reported MIME type is never
// trusted on its own — the route sniffs magic bytes too.
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB per design spec

export const qrIdParamSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{6,32}$/, "Malformed QR id");
