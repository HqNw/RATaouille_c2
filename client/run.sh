#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./run_clients.sh <number_of_clients>"
  exit 1
fi

NUM_CLIENTS=$1
PIDS=()

trap "kill_all" SIGINT

kill_all() {
  echo "Terminating clients..."
  for pid in "${PIDS[@]}"; do
    kill "$pid"
  done
  wait
  echo "All clients terminated."
  exit 0
}

for i in $(seq 1 $NUM_CLIENTS)
do
  python3 client.py --local --id $i &
  sleep 0.01
  PIDS+=($!)
done

echo "$NUM_CLIENTS clients started."

wait
