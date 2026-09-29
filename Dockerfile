FROM oven/bun:1.2-alpine AS runner

WORKDIR /app

# Copy worker definition and install dependencies
COPY workers/caller-worker/package.json ./
RUN bun install

# Copy worker source code
COPY workers/caller-worker/ ./

ENV NODE_ENV=production
ENV III_URL=ws://engine:49134

CMD ["bun", "run", "src/worker.ts"]