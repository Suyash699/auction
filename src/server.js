require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGO_URI;

async function start() {
  if (!mongoUri) {
    throw new Error("MONGO_URI must be set.");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Auction API listening on port ${port}.`);
  });
}

start().catch((error) => {
  console.error("Failed to start Auction API:", error);
  process.exitCode = 1;
});
