export type DocumentStatus = "processing" | "classified" | "error";

export interface DocumentFile {
  id: string;
  name: string;
  originalName: string;
  account: string;
  category: string;
  tags: string[];
  status: DocumentStatus;
  uploadedAt: Date;
  size: number;
  pageCount: number;
  ocrText?: string;
  metadata?: Record<string, string>;
}

export interface Account {
  name: string;
  documentCount: number;
}
