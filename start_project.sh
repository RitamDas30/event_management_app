#!/bin/bash
# Kill old
fuser -k 5000/tcp 5173/tcp 27017/tcp || true

# Start Mongo
mkdir -p ./mongodb_data
mongod --dbpath ./mongodb_data --port 27017 > mongo.log 2>&1 &

# Start Backend
cd backend
npm run dev > ../backend.log 2>&1 &
cd ..

# Start Frontend
cd frontend
npm run dev > ../frontend.log 2>&1 &
cd ..

echo "Servers starting..."
