import { ShieldAlert } from "lucide-react"

export function MedicalWorkspaceBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex items-start sm:items-center">
        <ShieldAlert className="h-5 w-5 text-amber-600 mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <span className="font-semibold mr-1">Medical/Mental Health Workspace:</span>
          Content generated here must be for general education only. Do not provide specific patient advice, diagnosis, or treatment recommendations. All content should undergo professional review before publishing.
        </div>
      </div>
    </div>
  )
}
