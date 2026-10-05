import {
  DashboardIcon,
  MenuIcon,
  QrIcon,
  AnalyticsIcon,
  SettingsIcon,
} from "@/components/ui/icons";

// Shared by the desktop sidebar and the mobile bottom tab bar so the
// two navs can never drift out of sync.
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/menus", label: "Menus", icon: MenuIcon },
  { href: "/qr-codes", label: "QR Codes", icon: QrIcon },
  { href: "/analytics", label: "Analytics", icon: AnalyticsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];
