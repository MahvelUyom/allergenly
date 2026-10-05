import { SearchButton } from "./SearchButton";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

export function AppHeader({ title, subtitle, rightSlot }: AppHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 lg:mb-8 lg:gap-6">
      {/* min-w-0 lets a long title/subtitle wrap instead of refusing to
          shrink below its content width and forcing the row to scroll
          horizontally — the default flex-item behavior with none of
          this app's headers are short enough to rely on. */}
      <div className="min-w-0">
        <h1 className="text-h2 text-charcoal lg:text-h1">{title}</h1>
        {subtitle && <p className="mt-1 text-label text-charcoal/70 lg:text-body">{subtitle}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
        {rightSlot}
        <SearchButton />
        <NotificationBell />
        <AccountMenu />
      </div>
    </div>
  );
}
