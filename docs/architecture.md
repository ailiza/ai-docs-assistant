# System Architecture

## Overview

Spotify's backend is built on a microservices architecture running on AWS. We have over 800 individual services communicating over both REST and gRPC.

## Key Systems

### API Gateway
All external traffic enters through our API Gateway which handles authentication, rate limiting, and routing to downstream services.

### Data Pipeline
We use Apache Kafka for real-time event streaming. Every play, pause, and skip is published as an event and consumed by multiple downstream services for recommendations, analytics, and billing.

### Storage
- **PostgreSQL** — user data, playlists, subscriptions
- **Cassandra** — play history, high write volume data
- **S3** — audio files, images, podcasts
- **Redis** — caching, session management

## Service Communication
Services communicate using gRPC for internal calls and REST for external APIs. All services must register with our service mesh and implement health check endpoints at `/health`.