import { Link } from "react-router-dom";
import { Card } from "../ui/card";
import StatusBadge from "../shared/StatusBadge";
import { formatDateShort, formatCNIC } from "../../utils/helpers";

const DisputeCard = ({ dispute, actions }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">Dispute #{dispute.disputeId}</p>
          <h3 className="text-base font-semibold">Parcel: {dispute.parcelId}</h3>
        </div>
        <StatusBadge status={dispute.status} />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p>
          <span className="font-medium">Claimant:</span> {dispute.claimantName}
        </p>
        <p>
          <span className="font-medium">CNIC:</span> {formatCNIC(dispute.claimantCNIC)}
        </p>
        <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{dispute.description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">{formatDateShort(dispute.filedAt)}</span>
        <div className="flex items-center gap-2">
          {actions}
          <Link to={`/disputes/${dispute._id}`} className="text-sm font-medium text-[#1B4332] hover:underline dark:text-[#D4AF37]">
            View
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default DisputeCard;
