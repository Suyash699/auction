const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      required: true,
    },
    endsAt: { type: Date, required: true },
    startingPrice: { type: Number, required: true, min: 0 },
    currentBid: {
      amount: { type: Number, required: true },
      bidderId: { type: mongoose.Schema.Types.ObjectId, default: null },
      bidId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Auction || mongoose.model("Auction", auctionSchema);
