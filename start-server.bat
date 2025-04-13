@echo off
set NODE_OPTIONS=--loader ts-node/esm
npx ts-node --project tsconfig.server.json server.ts 