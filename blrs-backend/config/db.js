const mongoose = require("mongoose");
global.mongoError = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) {
    // wait for connection to establish
    await new Promise(resolve => mongoose.connection.once('connected', resolve));
    return mongoose.connection;
  }
  try {
    let uri = process.env.MONGODB_URI;
    // VERCEL SRV BUG BYPASS FOR FINAL CLUSTER:
    if (uri && uri.startsWith("mongodb+srv://")) {
      const credentials = uri.split("@")[0].replace("mongodb+srv://", "");
      uri = `mongodb://${credentials}@ac-ljjofdy-shard-00-00.stfezbz.mongodb.net:27017,ac-ljjofdy-shard-00-01.stfezbz.mongodb.net:27017,ac-ljjofdy-shard-00-02.stfezbz.mongodb.net:27017/blrs_db?ssl=true&replicaSet=atlas-wshn7o-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    global.mongoError = error.message;
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