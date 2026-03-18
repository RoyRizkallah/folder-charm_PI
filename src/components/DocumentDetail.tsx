import { X, Tag, FileText, Edit3, ArrowRightLeft, Download } from "lucide-react";
import { DocumentFile } from "@/types/document";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { useState } from "react";
import { categories } from "@/data/mockDocuments";

interface DocumentDetailProps {
  document: DocumentFile;
  onClose: () => void;
  onUpdate: (doc: DocumentFile) => void;
}

export function DocumentDetail({ document, onClose, onUpdate }: DocumentDetailProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(document.name);
  const [isReassigning, setIsReassigning] = useState(false);

  const handleDownload = () => {
    if (!document.pdfBytes) return;
    const blob = new Blob([document.pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRename = () => {
    if (newName.trim() && newName !== document.name) {
      onUpdate({ ...document, name: newName.trim() });
    }
    setIsRenaming(false);
  };

  const handleReassignCategory = (cat: string) => {
    onUpdate({ ...document, category: cat });
    setIsReassigning(false);
  };

  return (
    <div className="w-96 border-l border-border bg-card h-full overflow-y-auto shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Document Details</h2>
        <div className="flex items-center gap-1">
          {document.pdfBytes && (
            <button onClick={handleDownload} className="p-1 rounded hover:bg-muted transition-colors" title="Download PDF">
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
            <button onClick={() => setIsRenaming(true)} className="p-1 rounded hover:bg-muted">
              <Edit3 className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {isRenaming ? (
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm px-2 py-1.5 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
              <button onClick={handleRename} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-medium">
                Save
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-foreground">{document.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{document.originalName}</p>
        </div>

        {/* Status */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
          <StatusBadge status={document.status} />
        </div>

        {/* Account & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Account</label>
            <p className="text-sm text-foreground">{document.account}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
              <button onClick={() => setIsReassigning(!isReassigning)} className="p-1 rounded hover:bg-muted">
                <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            {isReassigning ? (
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleReassignCategory(cat)}
                    className={`block w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${
                      cat === document.category
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground">{document.category}</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Pages</label>
            <p className="text-sm text-foreground">{document.pageCount}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Uploaded</label>
            <p className="text-sm text-foreground">{format(document.uploadedAt, "MMM d, yyyy")}</p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {document.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Metadata */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Metadata</label>
            <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
              {Object.entries(document.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Text */}
        {document.ocrText && (
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Extracted Text</label>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{document.ocrText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
