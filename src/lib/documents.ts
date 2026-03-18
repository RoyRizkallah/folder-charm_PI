import { supabase } from "@/integrations/supabase/client";
import { DocumentFile } from "@/types/document";

const MOCK_DOCS: DocumentFile[] = [
  {
    id: "mock-1",
    name: "Q3 2024 Financial Report",
    originalName: "Q3_2024_Financial_Report.pdf",
    account: "Acme Corp",
    category: "Financial Reports",
    tags: ["quarterly", "revenue", "2024"],
    status: "classified",
    uploadedAt: new Date("2024-09-15"),
    size: 204800,
    pageCount: 12,
    ocrText: "Quarterly revenue increased by 18% compared to Q2...",
  },
  {
    id: "mock-2",
    name: "Software License Agreement",
    originalName: "Software_License_Agreement.pdf",
    account: "TechVentures Ltd",
    category: "Contracts",
    tags: ["license", "software", "legal"],
    status: "classified",
    uploadedAt: new Date("2024-08-20"),
    size: 153600,
    pageCount: 8,
    ocrText: "This Software License Agreement is entered into as of January 1, 2024...",
  },
  {
    id: "mock-3",
    name: "Invoice #INV-2024-0042",
    originalName: "Invoice_INV-2024-0042.pdf",
    account: "Globex Inc",
    category: "Invoices",
    tags: ["invoice", "payment", "2024"],
    status: "classified",
    uploadedAt: new Date("2024-03-05"),
    size: 51200,
    pageCount: 2,
    ocrText: "Invoice Date: March 5, 2024. Due Date: April 5, 2024. Total: $4,750.00",
  },
  {
    id: "mock-4",
    name: "Employee Onboarding Policy",
    originalName: "Employee_Onboarding_Policy.pdf",
    account: "Initech",
    category: "HR Documents",
    tags: ["hr", "onboarding", "policy"],
    status: "classified",
    uploadedAt: new Date("2024-01-10"),
    size: 92160,
    pageCount: 5,
    ocrText: "Welcome to Initech. This document outlines the onboarding process...",
  },
  {
    id: "mock-5",
    name: "2023 Corporate Tax Return",
    originalName: "2023_Corporate_Tax_Return.pdf",
    account: "Acme Corp",
    category: "Tax Documents",
    tags: ["tax", "2023", "corporate"],
    status: "classified",
    uploadedAt: new Date("2024-02-28"),
    size: 307200,
    pageCount: 24,
    ocrText: "Form 1120 - U.S. Corporation Income Tax Return. Tax year 2023...",
  },
  {
    id: "mock-6",
    name: "Board Meeting Minutes - Feb 2024",
    originalName: "Board_Meeting_Minutes_Feb2024.pdf",
    account: "TechVentures Ltd",
    category: "Meeting Notes",
    tags: ["board", "minutes", "february"],
    status: "classified",
    uploadedAt: new Date("2024-02-15"),
    size: 71680,
    pageCount: 4,
    ocrText: "Meeting called to order at 9:00 AM. Attendees: John Smith, Jane Doe...",
  },
  {
    id: "mock-7",
    name: "API Integration Specification",
    originalName: "API_Integration_Spec_v2.pdf",
    account: "Globex Inc",
    category: "Technical Docs",
    tags: ["api", "integration", "technical"],
    status: "classified",
    uploadedAt: new Date("2024-04-01"),
    size: 184320,
    pageCount: 18,
    ocrText: "This document describes the REST API endpoints available for integration...",
  },
  {
    id: "mock-8",
    name: "Sample Processing Document",
    originalName: "Sample_Upload.pdf",
    account: "Unassigned",
    category: "Other",
    tags: [],
    status: "processing",
    uploadedAt: new Date(),
    size: 40960,
    pageCount: 0,
  },
];

const GEMINI_API_KEY = "AIzaSyCov9wudna9jDvYF-g6KIU7-V87saxqLdo";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function classifyWithGemini(file: File): Promise<{ title: string; account: string; category: string; tags: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: { mime_type: "application/pdf", data: base64 },
          },
          {
            text: `Analyze this PDF document and respond with ONLY a JSON object (no markdown, no code block) with these fields:
- title: a clean descriptive title for the document
- account: the company or person name this document belongs to (or "Unassigned" if unclear)
- category: one of: Financial Reports, Contracts, Invoices, HR Documents, Tax Documents, Meeting Notes, Technical Docs, Correspondence, Legal Documents, Other
- tags: array of 3-5 relevant tags

Example: {"title":"Q3 Financial Report","account":"Acme Corp","category":"Financial Reports","tags":["quarterly","finance","2024"]}`,
          },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try {
    return JSON.parse(text.trim());
  } catch {
    return {
      title: file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
      account: "Unassigned",
      category: "Other",
      tags: [],
    };
  }
}

export async function uploadDocuments(
  files: File[],
  onClassified: (id: string, updates: Partial<DocumentFile>) => void
): Promise<DocumentFile[]> {
  const results: DocumentFile[] = [];

  for (const file of files) {
    const tempDoc: DocumentFile = {
      id: `local-${Date.now()}-${Math.random()}`,
      name: file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
      originalName: file.name,
      account: "…",
      category: "…",
      tags: [],
      status: "processing",
      uploadedAt: new Date(),
      size: file.size,
      pageCount: 0,
    };
    results.push(tempDoc);

    // Classify with Gemini and notify caller when done
    classifyWithGemini(file).then((classification) => {
      onClassified(tempDoc.id, {
        name: classification.title || tempDoc.name,
        account: classification.account || "Unknown",
        category: classification.category || "Other",
        tags: classification.tags || [],
        status: "classified",
      });
    }).catch((err) => {
      console.error("Gemini error:", err);
      onClassified(tempDoc.id, { status: "error" });
    });
  }

  return results;
}

export async function fetchDocuments(): Promise<DocumentFile[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbToDocument);
}

export async function updateDocument(id: string, updates: Partial<Pick<DocumentFile, "name" | "account" | "category" | "tags">>): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).single();

  if (doc?.storage_path) {
    await supabase.storage.from("documents").remove([doc.storage_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

function mapDbToDocument(row: any): DocumentFile {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    account: row.account,
    category: row.category,
    tags: row.tags || [],
    status: row.status as DocumentFile["status"],
    uploadedAt: new Date(row.uploaded_at),
    size: row.size,
    pageCount: row.page_count,
    ocrText: row.ocr_text || undefined,
    metadata: row.metadata || undefined,
  };
}

export function subscribeToDocuments(callback: (doc: DocumentFile) => void) {
  return supabase
    .channel("documents-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "documents" },
      (payload) => {
        callback(mapDbToDocument(payload.new));
      }
    )
    .subscribe();
}
