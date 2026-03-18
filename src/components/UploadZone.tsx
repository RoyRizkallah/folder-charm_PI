import { Upload, FolderUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf"
      );
      if (files.length > 0) onUpload(files);
    },
    [onUpload]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf"
    );
    if (files.length > 0) onUpload(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "upload-zone cursor-pointer p-8 flex flex-col items-center justify-center gap-3 text-center",
        isDragging && "upload-zone-active"
      )}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <FolderUp className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          Drop a folder of PDFs here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports PDF files · Folders will be scanned recursively
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
    </div>
  );
}
