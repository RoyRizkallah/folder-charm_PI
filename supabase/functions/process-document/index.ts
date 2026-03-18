import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Missing documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.storage_path!);

    if (downloadError || !fileData) {
      await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text content from PDF (basic extraction)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const extractedText = extractTextFromPdf(bytes);

    // Use AI to classify the document
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a document classification AI. Analyze the document filename and any extracted text to determine:
1. A clean, descriptive document title
2. The account/company name this document belongs to
3. A category from: Financial Reports, Contracts, Invoices, HR Documents, Tax Documents, Meeting Notes, Technical Docs, Correspondence, Legal Documents, Other
4. 3-5 relevant tags

Respond using the provided tool.`,
          },
          {
            role: "user",
            content: `Filename: ${doc.original_name}\n\nExtracted text (first 3000 chars):\n${extractedText.slice(0, 3000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_document",
              description: "Classify the document with extracted metadata",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clean descriptive title" },
                  account: { type: "string", description: "Account/company name" },
                  category: {
                    type: "string",
                    enum: [
                      "Financial Reports", "Contracts", "Invoices", "HR Documents",
                      "Tax Documents", "Meeting Notes", "Technical Docs",
                      "Correspondence", "Legal Documents", "Other",
                    ],
                  },
                  tags: { type: "array", items: { type: "string" }, description: "3-5 tags" },
                  metadata: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    description: "Any extracted metadata key-value pairs",
                  },
                },
                required: ["title", "account", "category", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_document" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: classify from filename only
      await supabase.from("documents").update({
        status: "classified",
        name: doc.original_name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
        ocr_text: extractedText.slice(0, 10000),
      }).eq("id", documentId);

      return new Response(JSON.stringify({ success: true, fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let classification;

    try {
      classification = JSON.parse(toolCall.function.arguments);
    } catch {
      classification = {
        title: doc.original_name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
        account: "Unassigned",
        category: "Other",
        tags: [],
      };
    }

    // Update the document with classification results
    await supabase.from("documents").update({
      name: classification.title,
      account: classification.account,
      category: classification.category,
      tags: classification.tags || [],
      metadata: classification.metadata || {},
      ocr_text: extractedText.slice(0, 10000),
      status: "classified",
    }).eq("id", documentId);

    return new Response(JSON.stringify({ success: true, classification }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Basic text extraction from PDF binary
function extractTextFromPdf(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);

  // Extract text between stream/endstream for text content
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const content = match[1];
    // Look for text operators: Tj, TJ, '
    const textRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch;
    while ((textMatch = textRegex.exec(content)) !== null) {
      const decoded = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (decoded.trim()) text.push(decoded.trim());
    }

    // TJ array operator
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(content)) !== null) {
      const innerRegex = /\(([^)]*)\)/g;
      let innerMatch;
      const parts: string[] = [];
      while ((innerMatch = innerRegex.exec(tjMatch[1])) !== null) {
        parts.push(innerMatch[1]);
      }
      if (parts.length) text.push(parts.join(""));
    }
  }

  return text.join(" ").replace(/\s+/g, " ").trim();
}
