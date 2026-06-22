const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    console.log("Attempting direct connection fallback bypassing SRV...");
    try {
      const directURI = "mongodb://blrs-admin:blrsadmin123@ac-gzs7wsl-shard-00-00.y5zkmio.mongodb.net:27017,ac-gzs7wsl-shard-00-01.y5zkmio.mongodb.net:27017,ac-gzs7wsl-shard-00-02.y5zkmio.mongodb.net:27017/blrs_db?ssl=true&replicaSet=atlas-gzs7wsl-shard-0&authSource=admin&retryWrites=true&w=majority";
      const conn2 = await mongoose.connect(directURI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(`MongoDB Fallback Connected: ${conn2.connection.host}`);
    } catch (fallbackError) {
      console.error("Fallback Connection Failed:", fallbackError.message);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

module.exports = connectDB;