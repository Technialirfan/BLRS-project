const pick = (obj, fields = []) =>
  fields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

const sanitizeOfficer = (officerDoc) => {
  if (!officerDoc) return null;
  const officer = officerDoc.toObject ? officerDoc.toObject() : officerDoc;
  delete officer.password;
  delete officer.__v;
  return officer;
};

const createSuccessResponse = (message, data = {}) => ({
  success: true,
  message,
  data,
});

const createErrorResponse = (message, errors) => ({
  success: false,
  message,
  ...(errors ? { errors } : {}),
});

const createPaginatedResponse = ({ message = "Data fetched successfully", items = [], total = 0, page = 1, limit = 10, key = "items" }) => ({
  success: true,
  message,
  count: items.length,
  total,
  page,
  pages: Math.max(1, Math.ceil(total / limit)),
  data: {
    [key]: items,
  },
});

const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const normalizeParcelId = (parcelId = "") => String(parcelId).trim().toUpperCase();

const truncateHash = (hash = "", visible = 10) => {
  if (!hash || hash.length <= visible) return hash;
  return `${hash.slice(0, visible)}...`;
};

const toCSV = (rows = [], headers = []) => {
  const escape = (value) => {
    const str = value === undefined || value === null ? "" : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map((h) => escape(h.label)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
};

module.exports = {
  pick,
  sanitizeOfficer,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  getPagination,
  normalizeParcelId,
  truncateHash,
  toCSV,
};
