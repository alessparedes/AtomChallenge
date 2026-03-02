#!/bin/bash
docker compose up -d --build $SERVICE
docker image prune -f
