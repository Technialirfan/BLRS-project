const mongoose = require("mongoose");

const uri = "mongodb+srv://blrs-admin:blrs-admin1122%40%23%24@blrs-admin.y5zkmio.mongodb.net/blrs_db?retryWrites=true&w=majority&appName=blrs-admin";

async function testConnection() {
  try {
    await mongoose.connect(uri);
    console.log("SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error("FAIL", err.message);
    process.exit(1);
  }
}

testConnection();
