require("dotenv").config();

const connectDB = require("../config/db");
const Officer = require("../models/Officer");
const Land = require("../models/Land");
const Dispute = require("../models/Dispute");
const AuditLog = require("../models/AuditLog");

const seedOfficers = [
  {
    fullName: "System Administrator",
    cnic: "0000000000001",
    email: "admin@blrs.gov.pk",
    password: "Officer@2024",
    phone: "03001234567",
    role: "admin",
    assignedDistrict: null,
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    isActive: true,
  },
  {
    fullName: "Muhammad Ayaz Khan",
    cnic: "5430100000002",
    email: "patwari.quetta@blrs.gov.pk",
    password: "Officer@2024",
    phone: "03011234567",
    role: "patwari",
    assignedDistrict: "Quetta",
    walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    isActive: true,
  },
  {
    fullName: "Abdul Qadir Mengal",
    cnic: "5430100000003",
    email: "tehsildar.quetta@blrs.gov.pk",
    password: "Officer@2024",
    phone: "03021234567",
    role: "tehsildar",
    assignedDistrict: "Quetta",
    walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    isActive: true,
  },
  {
    fullName: "Sardar Ahmed Raisani",
    cnic: "5430100000004",
    email: "dc.quetta@blrs.gov.pk",
    password: "Officer@2024",
    phone: "03031234567",
    role: "dc",
    assignedDistrict: "Quetta",
    walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    isActive: true,
  },
  {
    fullName: "Haji Noor Muhammad",
    cnic: "5330100000005",
    email: "patwari.gwadar@blrs.gov.pk",
    password: "Officer@2024",
    phone: "03041234567",
    role: "patwari",
    assignedDistrict: "Gwadar",
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log("\nSeeding database...\n");

    await Promise.all([
      Officer.deleteMany({}),
      Land.deleteMany({}),
      Dispute.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    for (const officerData of seedOfficers) {
      await Officer.create(officerData);
      console.log(`Created: ${officerData.email} (${officerData.role})`);
    }

    console.log("\nDatabase seeded successfully.");
    console.log("All officers password: Officer@2024\n");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
