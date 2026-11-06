import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Rendered size in pixels (square). */
  size?: number;
  /** Show the app name next to the mark. */
  showName?: boolean;
  /** Hide from screen readers when the name is already shown nearby. */
  decorative?: boolean;
  className?: string;
}

/** App brand mark (public/logo.svg). Reused in header, sidebar and auth pages. */
export function Logo({ size = 32, showName = false, decorative = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.svg"
        alt={showName || decorative ? "" : siteConfig.name}
        width={size}
        height={size}
        priority
      />
      {showName && (
        <span className="font-semibold tracking-tight">{siteConfig.name}</span>
      )}
    </span>
  );
}
