const express = require("express");
const bidsRouter = require("./routes/bids");

const app = express();

app.use(express.json());
app.use("/bid", bidsRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error." });
});

module.exports = app;
