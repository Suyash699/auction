const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    idempotencyKey: { type: String, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bidSchema.index(
  { auctionId: 1, userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);
bidSchema.index({ auctionId: 1, amount: -1 });

module.exports = mongoose.models.Bid || mongoose.model("Bid", bidSchema);
