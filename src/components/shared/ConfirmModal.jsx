import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Card } from "../ui/card";

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, landSummary }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      {landSummary ? (
        <Card className="p-4 text-sm">
          <p>
            <span className="font-semibold">Parcel:</span> {landSummary.parcelId}
          </p>
          <p>
            <span className="font-semibold">Owner:</span> {landSummary.ownerName}
          </p>
          <p>
            <span className="font-semibold">District:</span> {landSummary.district}
          </p>
        </Card>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? "Processing..." : "Confirm"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmModal;
