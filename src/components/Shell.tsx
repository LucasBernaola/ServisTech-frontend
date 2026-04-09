import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen necotec-bg overflow-hidden">
      <div className="mx-auto w-full h-full px-4 py-6 2xl:px-8">
        <div className="card h-full flex overflow-hidden">
          
          {/* SIDEBAR */}
          <aside className="hidden md:flex md:w-64 border-r border-white/10">
            <div className="sticky top-0 h-full w-full">
              <Sidebar />
            </div>
          </aside>

          {/* MAIN */}
          <div className="flex flex-1 flex-col">
            
            {/* TOPBAR */}
            <div className="border-b border-white/10">
              <Topbar />
            </div>

            {/* CONTENT SCROLL */}
            <main className="flex-1 overflow-y-auto p-5 md:p-6">
              {children}
            </main>
          </div>

        </div>
      </div>
    </div>
  );
}