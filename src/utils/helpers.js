export const formatCNIC = (cnic) => {
  if (!cnic || cnic.length !== 13) return cnic;
  return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
};

export const cleanCNIC = (formatted = "") => formatted.replace(/-/g, "");

export const sqftToMarla = (sqft) => (sqft / 225).toFixed(2);
export const sqftToKanal = (sqft) => (sqft / 4500).toFixed(2);
export const sqftToAcre = (sqft) => (sqft / 43560).toFixed(4);

export const convertArea = (value, fromUnit) => {
  let sqft;
  switch (fromUnit) {
    case "marla":
      sqft = value * 225;
      break;
    case "kanal":
      sqft = value * 4500;
      break;
    case "acre":
      sqft = value * 43560;
      break;
    default:
      sqft = value;
  }
  return {
    sqft: Math.round(sqft),
    marla: (sqft / 225).toFixed(2),
    kanal: (sqft / 4500).toFixed(3),
    acre: (sqft / 43560).toFixed(4),
  };
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateShort = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const truncateHash = (hash, chars = 8) => {
  if (!hash) return "—";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

export const generateFakeTxHash = () =>
  `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

export const generateFakeIPFSHash = () =>
  `Qm${Array.from({ length: 44 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"[Math.floor(Math.random() * 58)]).join("")}`;

export const generateFakeBlockNumber = () => Math.floor(Math.random() * 90000) + 10000;

export const generateParcelId = (districtCode) =>
  `${districtCode}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

export const getRoleColor = (role) =>
  (
    {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      patwari: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      tehsildar: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      dc: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }[role] || "bg-gray-100 text-gray-800"
  );

export const getRoleLabel = (role) =>
  (
    {
      admin: "System Administrator",
      patwari: "Patwari",
      tehsildar: "Tehsildar",
      dc: "Deputy Commissioner",
    }[role] || role
  );

export const copyToClipboard = async (text) => {
  await navigator.clipboard.writeText(text);
};
