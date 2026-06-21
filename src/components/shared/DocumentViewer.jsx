import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, Download, Copy, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogHeader, DialogTitle } from "../ui/dialog";
import { copyToClipboard } from "../../utils/helpers";

const DocumentViewer = ({ documents = [] }) => {

  return (
    <div className="space-y-2">
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents attached.</p>
      ) : (
        documents.map((doc, idx) => (
          <div
            key={`${doc.hash}-${idx}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#1B4332]" />
              <div>
                <p className="text-sm font-medium">{doc.type}</p>
                <p className="tx-hash text-xs text-slate-500">{doc.hash}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                if (doc.hash.startsWith("local-")) {
                  const filename = doc.hash.replace("local-", "");
                  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");
                  window.open(`${baseUrl}/uploads/${filename}`, "_blank");
                } else {
                  window.open(`https://gateway.pinata.cloud/ipfs/${doc.hash}`, "_blank");
                }
              }}>
                <Eye className="mr-1 h-3.5 w-3.5" /> View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (doc.hash.startsWith("local-")) {
                    const filename = doc.hash.replace("local-", "");
                    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");
                    window.open(`${baseUrl}/uploads/${filename}`, "_blank");
                  } else {
                    window.open(`https://gateway.pinata.cloud/ipfs/${doc.hash}`, "_blank");
                  }
                }}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> Download
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await copyToClipboard(doc.hash);
                  toast.success("Hash copied");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DocumentViewer;
