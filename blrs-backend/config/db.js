const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    // VERCEL SRV BUG BYPASS:
    if (uri && uri.startsWith("mongodb+srv://")) {
      const credentials = uri.split("@")[0].replace("mongodb+srv://", "");
      uri = `mongodb://${credentials}@ac-gzs7wsl-shard-00-00.y5zkmio.mongodb.net:27017,ac-gzs7wsl-shard-00-01.y5zkmio.mongodb.net:27017,ac-gzs7wsl-shard-00-02.y5zkmio.mongodb.net:27017/blrs_db?ssl=true&replicaSet=atlas-gzs7wsl-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

module.exports = connectDB;