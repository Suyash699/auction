const express = require("express");
const mongoose = require("mongoose");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");

const router = express.Router();
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

router.post("/", async (req, res, next) => {
  const { auction_id: auctionId, user_id: userId, amount } = req.body || {};
  const idempotencyKey = req.get("Idempotency-Key");

  if (
    typeof auctionId !== "string" ||
    !objectIdPattern.test(auctionId) ||
    typeof userId !== "string" ||
    !objectIdPattern.test(userId) ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      error:
        "auction_id and user_id must be MongoDB ObjectIds, and amount must be a positive number.",
    });
  }

  if (
    idempotencyKey !== undefined &&
    (idempotencyKey.length === 0 || idempotencyKey.length > 128)
  ) {
    return res.status(400).json({
      error: "Idempotency-Key must contain between 1 and 128 characters.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      if (idempotencyKey !== undefined) {
        const previousBid = await Bid.findOne({
          auctionId,
          userId,
          idempotencyKey,
        }).session(session);

        if (previousBid) {
          if (previousBid.amount !== amount) {
            result = {
              status: 409,
              body: {
                error:
                  "This Idempotency-Key was already used with a different amount.",
              },
            };
          } else {
            result = {
              status: 200,
              body: { bid: previousBid, duplicate: true },
            };
          }
          return;
        }
      }

      const auction = await Auction.findOneAndUpdate(
        {
          _id: auctionId,
          status: "active",
          $expr: { $gt: ["$endsAt", "$$NOW"] },
          "currentBid.amount": { $lt: amount },
        },
        {
          $set: {
            "currentBid.amount": amount,
            "currentBid.bidderId": userId,
            "currentBid.bidId": null,
          },
        },
        { new: true, session, runValidators: true }
      );

      if (!auction) {
        const currentAuction = await Auction.findById(auctionId).session(
          session
        );

        if (!currentAuction) {
          result = { status: 404, body: { error: "Auction not found." } };
        } else if (
          currentAuction.status !== "active" ||
          !(await Auction.exists({
            _id: auctionId,
            status: "active",
            $expr: { $gt: ["$endsAt", "$$NOW"] },
          }).session(session))
        ) {
          result = { status: 409, body: { error: "Auction is closed." } };
        } else {
          result = {
            status: 409,
            body: {
              error: "Bid must be strictly higher than the current top bid.",
              current_top_bid: currentAuction.currentBid,
            },
          };
        }
        return;
      }

      const bid = new Bid({
        auctionId,
        userId,
        amount,
        ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
      });
      await bid.save({ session });

      await Auction.updateOne(
        { _id: auctionId },
        { $set: { "currentBid.bidId": bid._id } },
        { session }
      );
      auction.currentBid.bidId = bid._id;

      result = {
        status: 201,
        body: { bid, current_top_bid: auction.currentBid },
      };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
});

module.exports = router;
