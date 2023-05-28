const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri =
      "mongodb+srv://thakurhospital:E00osEwyxdTlmfyD@cluster0.oel779j.mongodb.net/test";
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`\x1b[34m MongoDb Connected: ${conn.connection.host} \x1b[0m`);
    mongoose.set("debug", true);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
