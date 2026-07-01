import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden necotec-bg">
      <div className="flex h-full">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 md:pb-7">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>

          <Sidebar variant="mobile" />
        </div>
      </div>
    </div>
  );
}
