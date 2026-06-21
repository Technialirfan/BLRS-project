/**
 * BLRS Database Reset Script
 * ----------------------------
 * Drops ALL dummy data from MongoDB and re-creates
 * ONLY the System Administrator account so the admin
 * can add officers manually from the admin panel.
 *
 * Usage:  node scripts/resetDB.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blrs_db";

async function resetDatabase() {
  console.log("\n+------------------------------------------+");
  console.log("|   BLRS — Database Reset                  |");
  console.log("+------------------------------------------+\n");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const db = mongoose.connection.db;

  // 1. Drop all collections
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`  Dropped collection: ${col.name}`);
  }

  // 2. Re-create the Officers collection with ONLY the admin account
  const hashedPassword = await bcrypt.hash("Officer@2024", 12);

  const officersCollection = db.collection("officers");
  await officersCollection.insertOne({
    fullName: "System Administrator",
    cnic: "0000000000001",
    email: "admin@blrs.gov.pk",
    password: hashedPassword,
    phone: "03001234567",
    role: "admin",
    assignedDistrict: null,
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    bio: "",
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("\n✅ Admin account created:");
  console.log("   Email:    admin@blrs.gov.pk");
  console.log("   Password: Officer@2024");
  console.log("   Role:     admin\n");

  // 3. Rebuild indexes
  await officersCollection.createIndex({ email: 1 }, { unique: true });
  await officersCollection.createIndex({ cnic: 1 }, { unique: true });
  await officersCollection.createIndex({ role: 1, assignedDistrict: 1 });
  console.log("✅ Indexes rebuilt on officers collection.\n");

  console.log("+------------------------------------------+");
  console.log("|   Database reset complete!                |");
  console.log("|   Only admin account exists now.          |");
  console.log("|   Login and add officers from Admin Panel |");
  console.log("+------------------------------------------+\n");

  await mongoose.disconnect();
  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
