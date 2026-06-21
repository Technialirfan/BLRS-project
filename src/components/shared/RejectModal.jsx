import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

const RejectModal = ({ isOpen, onClose, onConfirm, title = "Reject Record" }) => {
  const [reason, setReason] = useState("");

  const submit = () => {
    if (reason.trim().length < 10) return;
    onConfirm?.(reason.trim());
    setReason("");
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <textarea
        className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-700"
        placeholder="Enter rejection reason (min 10 characters)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="text-right text-xs text-slate-500">{reason.length} / 10+</div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={submit} disabled={reason.trim().length < 10}>
          Confirm Rejection
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default RejectModal;
