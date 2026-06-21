import { Link } from "react-router-dom";
import { Card } from "../ui/card";
import StatusBadge from "../shared/StatusBadge";
import { formatDateShort } from "../../utils/helpers";
import { LAND_TYPES } from "../../utils/constants";

const leftBorder = {
  Pending: "border-l-4 border-l-amber-500",
  Verified: "border-l-4 border-l-blue-500",
  Registered: "border-l-4 border-l-green-600",
  Rejected: "border-l-4 border-l-red-600",
  TransferPending: "border-l-4 border-l-orange-500",
  Disputed: "border-l-4 border-l-red-700",
};

const LandCard = ({ land, showActions = true, onClick }) => {
  const type = LAND_TYPES.find((l) => l.value === land.landType);

  return (
    <Card
      onClick={onClick}
      className={`land-card cursor-pointer p-4 dark:bg-slate-800 dark:border-slate-700 ${leftBorder[land.status] || ""}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{land.parcelId}</h3>
        <StatusBadge status={land.status} size="sm" />
      </div>

      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
        <p>
          <span className="font-medium">Owner:</span> {land.ownerName}
        </p>
        <p>
          <span className="font-medium">Location:</span> {land.district}, {land.tehsil}, {land.mouza}
        </p>
        <p>
          <span className="font-medium">Area:</span> {land.areaMarla} Marla
        </p>
        <p>
          <span className="font-medium">Type:</span> {type?.label || land.landType}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatDateShort(land.createdAt)}</span>
        {showActions ? (
          <Link to={`/land/${land.parcelId}`} className="font-medium text-[#1B4332] hover:underline dark:text-[#D4AF37]">
            View Details
          </Link>
        ) : null}
      </div>
    </Card>
  );
};

export default LandCard;
