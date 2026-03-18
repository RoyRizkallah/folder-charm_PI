import { cn } from "@/lib/utils";
import { DocumentStatus } from "@/types/document";

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  processing: {
    label: "Processing",
    className: "bg-processing/15 text-processing border-processing/30",
  },
  classified: {
    label: "Classified",
    className: "bg-success/15 text-success border-success/30",
  },
  error: {
    label: "Error",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
        config.className,
        status === "processing" && "animate-pulse-progress"
      )}
    >
      {config.label}
    </span>
  );
}
