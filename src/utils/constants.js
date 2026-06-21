export const DISTRICTS = [
  { name: "Quetta", tehsils: ["Quetta", "Mastung", "Dasht", "Spin Karez"] },
  { name: "Kalat", tehsils: ["Kalat", "Surab", "Gazg", "Mangochar", "Soorab"] },
  { name: "Khuzdar", tehsils: ["Khuzdar", "Zehri", "Naal", "Wadh", "Ornach"] },
  { name: "Turbat", tehsils: ["Turbat", "Buleda", "Dastkari", "Mand"] },
  { name: "Gwadar", tehsils: ["Gwadar", "Pasni", "Ormara", "Jiwani", "Shagaf"] },
  { name: "Zhob", tehsils: ["Zhob", "Sherani", "Khost", "Qamardin Karez"] },
  { name: "Loralai", tehsils: ["Loralai", "Barkhan", "Duki", "Mekhtar", "Thal"] },
  { name: "Nasirabad", tehsils: ["Tamboo", "Dera Murad Jamali", "Chhalgari", "Loti"] },
  { name: "Sibi", tehsils: ["Sibi", "Lehri", "Sangan", "Harnai"] },
  { name: "Chagai", tehsils: ["Dalbandin", "Nushki", "Kharan", "Taftan"] },
  { name: "Lasbela", tehsils: ["Uthal", "Bela", "Winder", "Hub", "Liari"] },
  { name: "Nushki", tehsils: ["Nushki", "Dak"] },
  { name: "Panjgur", tehsils: ["Panjgur", "Gichk", "Panjgur City"] },
  { name: "Kech", tehsils: ["Turbat", "Tump", "Mand", "Dasht"] },
  { name: "Awaran", tehsils: ["Awaran", "Jhal Jhao", "Mashkay", "Khuzdar Road"] },
  { name: "Washuk", tehsils: ["Kharan", "Bastakk", "Yakmach"] },
  { name: "Harnai", tehsils: ["Harnai", "Shahrig", "Khost"] },
  { name: "Ziarat", tehsils: ["Ziarat", "Sanjawi", "Birmani"] },
  { name: "Duki", tehsils: ["Duki", "Babar Kach"] },
  { name: "Musakhel", tehsils: ["Musakhel", "Kingri", "Taunsa"] },
  { name: "Bolan", tehsils: ["Machh", "Bhag", "Ab-e-Gum", "Mach"] },
  { name: "Jaffarabad", tehsils: ["Dera Allah Yar", "Gandakha", "Jacobabad Road"] },
  { name: "Jhal Magsi", tehsils: ["Gandava", "Mirpur", "Jhal"] },
  { name: "Sohbatpur", tehsils: ["Sohbatpur", "Usta Mohammad", "Noshki Road"] },
  { name: "Kachhi", tehsils: ["Bolan", "Lehri", "Dhadar"] },
  { name: "Dera Bugti", tehsils: ["Dera Bugti", "Phelawagh", "Sui", "Pir Koh"] },
  { name: "Kohlu", tehsils: ["Kohlu", "Maiwand", "Kahan"] },
  { name: "Sherani", tehsils: ["Sherani", "Muslimbagh"] },
  { name: "Pishin", tehsils: ["Pishin", "Karezat", "Barshore", "Saranan"] },
  { name: "Killa Saifullah", tehsils: ["Killa Saifullah", "Muslim Bagh", "Kingri"] },
  { name: "Killa Abdullah", tehsils: ["Killa Abdullah", "Gulistan", "Chaman", "Dobandi"] },
  { name: "Kharan", tehsils: ["Kharan", "Saindak", "Nokundi"] },
  { name: "Mastung", tehsils: ["Mastung", "Dasht", "Karwat", "Spezand"] },
  { name: "Surab", tehsils: ["Surab", "Wadh"] },
  { name: "Tump", tehsils: ["Tump", "Mand", "Kolwa"] },
];

export const LAND_TYPES = [
  {
    value: "agricultural",
    label: "Agricultural",
    icon: "🌾",
    color: "#16A34A",
    bgColor: "#DCFCE7",
  },
  {
    value: "residential",
    label: "Residential",
    icon: "🏠",
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
  {
    value: "commercial",
    label: "Commercial",
    icon: "🏢",
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  {
    value: "tribal",
    label: "Tribal/Customary",
    icon: "⛰️",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  {
    value: "forest",
    label: "Forest",
    icon: "🌲",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  {
    value: "government",
    label: "Government",
    icon: "🏛️",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  {
    value: "barren",
    label: "Barren/Wasteland",
    icon: "🏜️",
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
];

export const DOCUMENT_TYPES = [
  { value: "fard_malkiat", label: "Fard Malkiat" },
  { value: "sale_deed", label: "Sale Deed (Bai Nama)" },
  { value: "inheritance", label: "Inheritance Certificate" },
  { value: "mutation", label: "Mutation (Intiqal)" },
  { value: "jamabandi", label: "Jamabandi" },
  { value: "survey_map", label: "Survey Map" },
  { value: "court_order", label: "Court Order / Decree" },
  { value: "tatimma", label: "Tatimma" },
  { value: "other", label: "Other" },
];

export const STATUS_CONFIG = {
  Pending: {
    label: "Under Process",
    color: "#D97706",
    bg: "#FEF3C7",
    darkBg: "#451A03",
    icon: "Clock",
  },
  Verified: {
    label: "Verified",
    color: "#2563EB",
    bg: "#DBEAFE",
    darkBg: "#1E3A5F",
    icon: "CheckCircle",
  },
  Registered: {
    label: "Registered",
    color: "#16A34A",
    bg: "#DCFCE7",
    darkBg: "#14532D",
    icon: "CheckCircle2",
  },
  Rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEE2E2",
    darkBg: "#450A0A",
    icon: "XCircle",
  },
  TransferPending: {
    label: "Transfer Pending",
    color: "#EA580C",
    bg: "#FED7AA",
    darkBg: "#431407",
    icon: "ArrowRightLeft",
  },
  Disputed: {
    label: "Disputed",
    color: "#DC2626",
    bg: "#FEE2E2",
    darkBg: "#450A0A",
    icon: "AlertTriangle",
    pulse: true,
  },
  Filed: {
    label: "Filed",
    color: "#6B7280",
    bg: "#F3F4F6",
    darkBg: "#1F2937",
    icon: "FileText",
  },
  UnderReview: {
    label: "Under Review",
    color: "#7C3AED",
    bg: "#EDE9FE",
    darkBg: "#2E1065",
    icon: "Search",
  },
  Resolved: {
    label: "Resolved",
    color: "#0D9488",
    bg: "#CCFBF1",
    darkBg: "#042F2E",
    icon: "CheckCircle",
  },
};

export const AREA_CONVERSIONS = {
  marlaToSqft: 225,
  kanalToSqft: 4500,
  acreToSqft: 43560,
  sqmeterToSqft: 10.764,
};

export const DISPUTE_TYPES = [
  { value: "ownership_claim", label: "Ownership Claim" },
  { value: "boundary", label: "Boundary Dispute" },
  { value: "fraud", label: "Fraud" },
  { value: "inheritance", label: "Inheritance" },
  { value: "other", label: "Other" },
];

export const WORKFLOW_STEPS = {
  registration: [
    { role: "patwari", action: "Register", label: "Registered by Patwari" },
    { role: "tehsildar", action: "Verify", label: "Verified by Tehsildar" },
    { role: "dc", action: "Approve", label: "Approved by DC" },
  ],
  transfer: [
    { role: "patwari", action: "Initiate", label: "Initiated by Patwari" },
    { role: "dc", action: "Approve", label: "Approved by DC" },
  ],
  dispute: [
    { role: "officer", action: "File", label: "Filed by Officer" },
    { role: "tehsildar", action: "Review", label: "Reviewed by Tehsildar" },
    { role: "dc", action: "Resolve", label: "Resolved by DC" },
  ],
};

export const BALOCHISTAN_CENTER = [30.1, 67.0];
export const BALOCHISTAN_ZOOM = 7;
export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
export const HARDHAT_CHAIN_ID = 31337;

export const ROLES = {
  ADMIN: "admin",
  PATWARI: "patwari",
  TEHSILDAR: "tehsildar",
  DC: "dc"
};

export const AUDIT_ACTIONS = {
  LAND_REGISTERED: "LAND_REGISTERED",
  LAND_VERIFIED: "LAND_VERIFIED",
  LAND_APPROVED: "LAND_APPROVED",
  LAND_REJECTED: "LAND_REJECTED",
  TRANSFER_INITIATED: "TRANSFER_INITIATED",
  TRANSFER_APPROVED: "TRANSFER_APPROVED",
  TRANSFER_REJECTED: "TRANSFER_REJECTED",
  DISPUTE_FILED: "DISPUTE_FILED",
  DISPUTE_REVIEWED: "DISPUTE_REVIEWED",
  DISPUTE_RESOLVED: "DISPUTE_RESOLVED",
  DISPUTE_REJECTED: "DISPUTE_REJECTED",
  OFFICER_CREATED: "OFFICER_CREATED",
  OFFICER_ACTIVATED: "OFFICER_ACTIVATED",
  OFFICER_DEACTIVATED: "OFFICER_DEACTIVATED",
  PROFILE_UPDATED: "PROFILE_UPDATED"
};
