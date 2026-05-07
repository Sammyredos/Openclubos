# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+
- pnpm 9+

## Local Setup
1. `pnpm install`
2. `docker-compose up -d`
3. `pnpm dev`

## Production
1. Build images: `docker-compose build`
2. Start services: `docker-compose up -d`
