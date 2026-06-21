import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import { formatDateShort, truncateHash } from "../../utils/helpers";
import { Button } from "../ui/button";

const LandHistory = ({ history = [], parcelId }) => {
  if (!history || history.length === 0) {
    return <p className="text-sm text-slate-500">Original owner since registration ({parcelId}).</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((item, idx) => (
        <div key={`${item.transferDocHash}-${idx}`} className="relative pl-6">
          <span className={`absolute left-0 top-1 h-3 w-3 rounded-full ${idx === 0 ? "bg-green-600" : "bg-slate-400"}`} />
          {idx !== history.length - 1 ? <span className="absolute left-[5px] top-4 h-full w-0.5 bg-slate-300 dark:bg-slate-600" /> : null}
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-xs uppercase text-slate-500">{item.transferType.replace("_", " ")}</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{item.fromName}</span> → <span className="font-semibold">{item.toName}</span>
            </p>
            <p className="text-xs text-slate-500">{formatDateShort(item.timestamp)}</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="tx-hash">{truncateHash(item.transferDocHash)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(item.transferDocHash);
                  toast.success("Hash copied");
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandHistory;
