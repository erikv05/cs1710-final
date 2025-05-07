#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Start Z3 server (Python)
echo "Starting Z3 server..."
cd z3_server
source .venv/bin/activate
uvicorn run_server:app --host 0.0.0.0 --port 8000 &
Z3_PID=$!
cd ..

# Start Node server
echo "Starting Node server..."
cd node_server
npx ts-node src/server.ts &
NODE_PID=$!
cd ..

# Start Vite frontend
echo "Starting Vite frontend..."
cd frontend
npm run dev &
VITE_PID=$!
cd ..

echo "All servers started!"
echo "Z3 server running on port 8000"
echo "Node server running on port 3000"
echo "Vite frontend running on port 5173"
echo "Press Ctrl+C to stop all servers"

# Wait for all background processes
wait 