import jsPDF from "jspdf";
import "jspdf-autotable";

const formatCNIC = (c) => (c ? `${c.slice(0, 5)}-${c.slice(5, 12)}-${c.slice(12)}` : "—");
const formatDateShort = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) : "—";
const truncateHash = (h, n = 8) => (h ? `${h.slice(0, n + 2)}...${h.slice(-n)}` : "—");

export const generateOwnershipCertificate = (land) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("GOVERNMENT OF BALOCHISTAN", 105, 10, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("REVENUE & ESTATE DEPARTMENT", 105, 18, { align: "center" });
  doc.setFontSize(11);
  doc.text("BALOCHISTAN LAND REGISTRY SYSTEM", 105, 26, { align: "center" });

  doc.setTextColor(27, 67, 50);
  doc.setFontSize(16);
  doc.text("OWNERSHIP CERTIFICATE", 105, 48, { align: "center" });
  doc.text("FARD MALKIAT", 105, 56, { align: "center" });

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(20, 60, 190, 60);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Certificate No: BLRS-${land.parcelId}-${new Date().getFullYear()}`, 20, 68);
  doc.text(
    `Issue Date: ${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}`,
    190,
    68,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
  doc.autoTable({
    startY: 75,
    head: [["Field", "Details"]],
    body: [
      ["Parcel / Khasra ID", land.parcelId],
      ["Owner Name", land.ownerName],
      ["Owner CNIC", formatCNIC(land.ownerCNIC)],
      ["Province", "Balochistan"],
      ["District", land.district],
      ["Tehsil", land.tehsil],
      ["Mouza", land.mouza],
      ["Land Type", `${land.landType?.charAt(0).toUpperCase()}${land.landType?.slice(1)}`],
      ["Area (Marla)", `${land.areaMarla} Marla`],
      ["Area (Sq Ft)", `${Number(land.areaSqFt).toLocaleString()} sq ft`],
      ["Area (Kanal)", `${land.areaKanal} Kanal`],
      ["GPS Coordinates", `${land.gpsLat}, ${land.gpsLng}`],
      ["Registration Status", "REGISTERED"],
      ["Registration Date", formatDateShort(land.createdAt)],
      ["NFT Token ID", land.nftTokenId ? `#${land.nftTokenId}` : "Not Minted"],
      ["Blockchain TX Hash", truncateHash(land.blockchainTxHash, 12)],
    ],
    headStyles: { fillColor: [27, 67, 50], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: 120 } },
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("APPROVAL CHAIN", 20, finalY);
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 2, 190, finalY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const approvals = [
    {
      label: "Registered by (Patwari)",
      name: land.registeredByPatwari?.fullName || "—",
      date: formatDateShort(land.createdAt),
    },
    {
      label: "Verified by (Tehsildar)",
      name: land.verifiedByTehsildar?.fullName || "—",
      date: "—",
    },
    {
      label: "Approved by (DC)",
      name: land.approvedByDC?.fullName || "—",
      date: formatDateShort(land.updatedAt),
    },
  ];

  approvals.forEach((a, i) => {
    const x = 20 + i * 57;
    doc.rect(x, finalY + 8, 52, 28);
    doc.setFont("helvetica", "bold");
    doc.text(a.label, x + 2, finalY + 14, { maxWidth: 48 });
    doc.setFont("helvetica", "normal");
    doc.text(a.name, x + 2, finalY + 22, { maxWidth: 48 });
    doc.text(`Date: ${a.date}`, x + 2, finalY + 30, { maxWidth: 48 });
  });

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 277, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    "This is a computer-generated certificate from the Balochistan Land Registry System (BLRS)",
    105,
    284,
    { align: "center" }
  );
  doc.text(
    "Verify this document at: blrs.gov.pk/verify | Helpline: 0800-BLRS (2577)",
    105,
    290,
    { align: "center" }
  );

  doc.save(`BLRS_Certificate_${land.parcelId}.pdf`);
};

export const generateLandReport = (land, history) => {
  const doc = new jsPDF();

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BALOCHISTAN LAND REGISTRY SYSTEM", 105, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("Official Land Record Report", 105, 20, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Land Record: ${land.parcelId}`, 20, 35);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 190, 35, { align: "right" });

  doc.autoTable({
    startY: 42,
    body: [
      ["Parcel ID", land.parcelId, "Status", land.status],
      ["Owner", land.ownerName, "CNIC", formatCNIC(land.ownerCNIC)],
      ["District", land.district, "Tehsil", land.tehsil],
      ["Mouza", land.mouza, "Type", land.landType],
      ["Area", `${land.areaMarla} Marla`, "Sq Ft", land.areaSqFt],
    ],
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
    headStyles: { fillColor: [27, 67, 50] },
  });

  if (history?.length) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ownership History", 20, doc.lastAutoTable.finalY + 12);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Type", "From", "To", "Date", "TX Hash"]],
      body: history.map((h) => [
        h.transferType,
        h.fromName,
        h.toName,
        formatDateShort(h.timestamp),
        truncateHash(h.transferDocHash, 8),
      ]),
      headStyles: { fillColor: [27, 67, 50] },
      styles: { fontSize: 8 },
    });
  }

};

export const generateSaleDeed = (land) => {
  const history = land.ownershipHistory || [];
  const lastTransfer = history.length > 0 ? history[history.length - 1] : null;
  const sellerName = lastTransfer ? lastTransfer.fromName : "Previous Owner";
  const buyerName = lastTransfer ? lastTransfer.toName : land.ownerName;
  const txHash = lastTransfer ? lastTransfer.blockchainTxHash : land.blockchainTxHash;
  const doc = new jsPDF();
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BALOCHISTAN LAND REGISTRY SYSTEM", 105, 12, { align: "center" });
  doc.setFontSize(12);
  doc.text("OFFICIAL SALE DEED", 105, 20, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const deedNo = `SD-${land.parcelId}-${Math.floor(Date.now() / 1000)}`;
  doc.text(`Deed Number: ${deedNo}`, 20, 35);
  doc.text(`Date: ${new Date().toLocaleDateString("en-PK")}`, 190, 35, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(
    `This Sale Deed serves as the official legal agreement for the transfer of land parcel ${land.parcelId}. ` +
    `The property described below is hereby transferred from the Seller to the Buyer.`,
    20, 45, { maxWidth: 170 }
  );

  doc.autoTable({
    startY: 55,
    head: [["Property Details", ""]],
    body: [
      ["Parcel ID", land.parcelId],
      ["District", land.district],
      ["Tehsil", land.tehsil],
      ["Mouza", land.mouza],
      ["Area", `${land.areaMarla} Marla (${land.areaSqFt} Sq. Ft.)`],
    ],
    headStyles: { fillColor: [27, 67, 50] },
    styles: { fontSize: 10 },
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Parties Involved", ""]],
    body: [
      ["SELLER NAME", sellerName],
      ["BUYER NAME", buyerName],
    ],
    headStyles: { fillColor: [27, 67, 50] },
    styles: { fontSize: 10 },
    didParseCell: function (data) {
      if (data.column.index === 0) data.cell.styles.fontStyle = 'bold';
    }
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.setLineWidth(0.5);
  doc.line(20, finalY, 80, finalY);
  doc.line(130, finalY, 190, finalY);
  doc.setFontSize(10);
  doc.text("Digital Signature (Seller)", 25, finalY + 5);
  doc.text("Digital Signature (Buyer)", 135, finalY + 5);

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(`Blockchain TX Hash: ${txHash || "Pending"}`, 20, finalY + 25);
  doc.text("Generated by BLRS System", 190, finalY + 25, { align: "right" });

  doc.save(`SaleDeed_${land.parcelId}.pdf`);
};

export const generateMutationCertificate = (land) => {
  const history = land.ownershipHistory || [];
  const lastTransfer = history.length > 0 ? history[history.length - 1] : null;
  const oldOwnerName = lastTransfer ? lastTransfer.fromName : "Previous Owner";
  const newOwnerName = lastTransfer ? lastTransfer.toName : land.ownerName;
  const txHash = lastTransfer ? lastTransfer.blockchainTxHash : land.blockchainTxHash;
  const patwariName = land.registeredByPatwariName || "Patwari";
  const approverName = "Approving Authority";
  const doc = new jsPDF();
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("BALOCHISTAN LAND REGISTRY SYSTEM", 105, 12, { align: "center" });
  doc.setFontSize(12);
  doc.text("MUTATION CERTIFICATE", 105, 20, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const mutationNo = `MUT-${land.parcelId}-${Math.floor(Date.now() / 1000)}`;
  doc.text(`Mutation Number: ${mutationNo}`, 20, 35);
  doc.text(`Approval Date: ${new Date().toLocaleDateString("en-PK")}`, 190, 35, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text(
    `This certificate verifies the mutation (change of ownership) of land parcel ${land.parcelId} in the ` +
    `official revenue records of Balochistan.`,
    20, 45, { maxWidth: 170 }
  );

  doc.autoTable({
    startY: 55,
    head: [["Mutation Record", ""]],
    body: [
      ["Old Owner", oldOwnerName],
      ["New Owner", newOwnerName],
      ["Approval Date", new Date().toLocaleDateString("en-PK")],
      ["Initiated By (Patwari)", patwariName || "Unknown"],
      ["Approved By", approverName || "Unknown"],
      ["Blockchain TX Hash", truncateHash(txHash, 12) || "Pending"],
    ],
    headStyles: { fillColor: [27, 67, 50] },
    styles: { fontSize: 10 },
    didParseCell: function (data) {
      if (data.column.index === 0) data.cell.styles.fontStyle = 'bold';
    }
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.setLineWidth(0.5);
  doc.line(75, finalY, 135, finalY);
  doc.setFontSize(10);
  doc.text("Digital Signature (Approving Authority)", 105, finalY + 5, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text("Generated by BLRS System", 105, finalY + 25, { align: "center" });

  doc.save(`Mutation_${land.parcelId}.pdf`);
};

