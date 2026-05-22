#!/bin/bash
cd "$(dirname "$0")"
cd backend && node server.js &
python3 -m http.server 9999 &
wait
