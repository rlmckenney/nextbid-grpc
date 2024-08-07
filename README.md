# NexBid - A Real-Time Bidding System

This is an experimental project to build a real-time bidding system. It is intended as a teaching tool for learning about structuring the various components of a real-time auction system. The project is not intended for production use, but should serve as a useful guide for building a start-up project that will be maintainable and scaleable - minimizing avoidable future tech-debt.

Uses the following technologies:

- Node.js
- Fastify
- TypeScript
- Redis
- PostgreSQL
- Docker
- Kubernetes
- gRPC / Protobuf
- Buf connect-es

## Repository Structure

```
├── apis          (public APIs hosted on nextbid subdomains)
├── apps          (apps that live on nextbid.com)
├── packages      (packages shared by apps, services, and APIs)
└── services      (internal services used by app(s) and API(s))
```

Child directories in these folders correspond to package scopes. For example, the `apps/www` directory contains the `@nextbid/www` package corresponding to the public website for the company.

Most packages are scoped under the `@nextbid` namespace. Within the monorepo, packages are referenced by their scope name, e.g. `@nextbid/www`, `@nextbid/api`, etc. Some related packages are grouped under an internal scope like `@bid-manager`, that includes `@bid-manager/definition`, `@bid-manager/service`, `@bid-manager/client`, etc.
