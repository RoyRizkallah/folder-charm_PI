import { useState, useMemo, useCallback, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { UploadZone } from "@/components/UploadZone";
import { DocumentTable } from "@/components/DocumentTable";
import { DocumentDetail } from "@/components/DocumentDetail";
import { SearchBar } from "@/components/SearchBar";
import { DocumentFile } from "@/types/document";
import { fetchDocuments, uploadDocuments, updateDocument, subscribeToDocuments } from "@/lib/documents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Index() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("All Documents");
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Load documents
  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = subscribeToDocuments((updatedDoc) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
      );
      if (selectedDoc?.id === updatedDoc.id) {
        setSelectedDoc(updatedDoc);
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [selectedDoc?.id]);

  const filteredDocs = useMemo(() => {
    let result = documents;
    if (selectedAccount === "Recent Uploads") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((d) => d.uploadedAt >= weekAgo);
    } else if (selectedAccount !== "All Documents") {
      result = result.filter((d) => d.account === selectedAccount);
    }
    if (categoryFilter) result = result.filter((d) => d.category === categoryFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.account.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.originalName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, selectedAccount, categoryFilter, searchQuery]);

  const accounts = useMemo(() => {
    const accountMap = new Map<string, number>();
    documents.forEach((d) => accountMap.set(d.account, (accountMap.get(d.account) || 0) + 1));
    return [
      { name: "All Documents", documentCount: documents.length },
      ...Array.from(accountMap.entries()).map(([name, count]) => ({ name, documentCount: count })),
    ];
  }, [documents]);

  const handleUpload = useCallback(async (files: File[]) => {
    try {
      const newDocs = await uploadDocuments(files, (id, updates) => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
        );
      });
      setDocuments((prev) => [...newDocs, ...prev]);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded — classifying with AI…`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  }, []);

  const handleUpdateDoc = useCallback(async (updated: DocumentFile) => {
    try {
      await updateDocument(updated.id, {
        name: updated.name,
        account: updated.account,
        category: updated.category,
        tags: updated.tags,
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSelectedDoc(updated);
      toast.success("Document updated");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelectAccount={setSelectedAccount}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedAccount}</h2>
              <p className="text-xs text-muted-foreground">
                {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <SearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <UploadZone onUpload={handleUpload} />
          <DocumentTable
            documents={filteredDocs}
            onSelectDocument={setSelectedDoc}
            selectedId={selectedDoc?.id}
          />
        </div>
      </main>

      {selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={handleUpdateDoc}
        />
      )}
    </div>
  );
}
