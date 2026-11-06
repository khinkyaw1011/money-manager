import { SiteHeader } from "@/components/layout/site-header";

/** Shared shell for sign-in / registration pages. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">{children}</main>
    </>
  );
}
