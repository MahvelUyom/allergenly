import { AppSidebar } from "./AppSidebar";
import { MobileTabBar } from "./MobileTabBar";
import { HeaderProvider } from "./HeaderContext";

interface AppShellProps {
  restaurantName: string;
  locationCount: number;
  userInitials: string;
  children: React.ReactNode;
}

// §1.9 App shell — fixed 260px sidebar + main content area on desktop.
// Below `lg`, the sidebar is replaced by a fixed bottom tab bar
// (MobileTabBar) and the content area goes full-width with small
// padding — the original layout reserved 260px for a sidebar with no
// mobile fallback at all, which left almost no usable width on a phone.
export function AppShell({ restaurantName, locationCount, userInitials, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar
        restaurantName={restaurantName}
        locationCount={locationCount}
        userInitials={userInitials}
      />
      <main className="px-4 pb-24 pt-6 lg:ml-[260px] lg:px-12 lg:py-10 lg:pb-10">
        <HeaderProvider value={{ initials: userInitials, restaurantName }}>{children}</HeaderProvider>
      </main>
      <MobileTabBar />
    </div>
  );
}
