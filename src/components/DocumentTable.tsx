import { FileText, ChevronRight, Download } from "lucide-react";
import { DocumentFile } from "@/types/document";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";

interface DocumentTableProps {
  documents: DocumentFile[];
  onSelectDocument: (doc: DocumentFile) => void;
  selectedId?: string;
}

function downloadDoc(doc: DocumentFile) {
  if (!doc.pdfBytes) return;
  const blob = new Blob([doc.pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `${doc.name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentTable({ documents, onSelectDocument, selectedId }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No documents found</p>
        <p className="text-xs mt-1">Upload a folder to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Document</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Account</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Balance</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Category</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Size</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className={`border-b border-border last:border-0 cursor-pointer transition-colors duration-75 ${
                selectedId === doc.id
                  ? "bg-primary/5"
                  : "hover:bg-muted/30"
              }`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{doc.originalName}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-foreground">{doc.account}</td>
              <td className="py-3 px-4 text-foreground font-medium">{doc.balance || "—"}</td>
              <td className="py-3 px-4 text-muted-foreground">{doc.category}</td>
              <td className="py-3 px-4"><StatusBadge status={doc.status} /></td>
              <td className="py-3 px-4 text-muted-foreground">{formatSize(doc.size)}</td>
              <td className="py-3 px-4 text-muted-foreground">{format(doc.uploadedAt, "MMM d, yyyy")}</td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  {doc.pdfBytes && (
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadDoc(doc); }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground/70" />
                    </button>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
