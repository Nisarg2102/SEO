import { Sidebar, Topbar } from "@/components/layout/Shell"
import { MedicalWorkspaceBanner } from "@/components/layout/MedicalBanner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In a real app, this would be determined by the current workspace configuration
  const isMedicalWorkspace = false;

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className="hidden lg:block lg:w-72 lg:shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {isMedicalWorkspace && <MedicalWorkspaceBanner />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
