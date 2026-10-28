# Auction Bidding API

Assignment ID: `v#hdf38%44`

## Run

Requirements: Node.js 20 or newer and MongoDB running as a replica set (required for transactions).

For a local MongoDB instance, start `mongod` with `--replSet rs0` and initialize the replica set once:

```powershell
mongosh
```

```javascript
rs.initiate()
```

Then, from the project directory:

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Set `MONGO_URI` in `.env` to your replica-set connection string. The example is `mongodb://127.0.0.1:27017/auction_app?replicaSet=rs0`.
