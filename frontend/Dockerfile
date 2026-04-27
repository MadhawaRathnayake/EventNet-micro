# ==========================================
# Stage 1: Install Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ==========================================
# Stage 2: Build the Application
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# This copies ALL files, including .env.local!
COPY . .

# Next.js will automatically detect .env.local here and bake the NEXT_PUBLIC_ variables
# into the client-side code correctly during this build step.
# Accept build-time variables from CI/CD pipeline
ARG NEXT_PUBLIC_BACKEND_API_URL
ARG NEXT_PUBLIC_PAYMENT_API_URL

# Expose them as environment variables so Next.js bakes them into the client-side build
ENV NEXT_PUBLIC_BACKEND_API_URL=$NEXT_PUBLIC_BACKEND_API_URL
ENV NEXT_PUBLIC_PAYMENT_API_URL=$NEXT_PUBLIC_PAYMENT_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================================
# Stage 3: Production Runner (Lean Image)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy only the necessary files from the standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# NOTE: No .env file is copied here.
# All secrets are injected at runtime by Kubernetes from the 'event-book-secrets' secret.

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
