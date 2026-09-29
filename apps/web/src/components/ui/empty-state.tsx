import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center animate-in fade-in-50", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-4">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
