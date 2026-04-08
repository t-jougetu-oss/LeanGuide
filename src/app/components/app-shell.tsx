import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col flex-1 pb-20">{children}</div>
      <BottomNav />
    </>
  );
}
