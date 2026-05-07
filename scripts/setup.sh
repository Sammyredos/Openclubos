#!/bin/bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm run build
