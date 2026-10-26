# ── Stage 1: build with Maven ─────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom first so the dependency layer is cached.
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .

# Download dependencies (this layer is re-used as long as pom.xml doesn't change).
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN ./mvnw -q -DskipTests package

# ── Stage 2: minimal runtime image ────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/target/image-resizer-backend-*.jar app.jar

EXPOSE 8080

# All runtime config comes from environment variables.
# Required: DB_URL, DB_USERNAME, DB_PASSWORD
# Optional: AI_SERVICE_URL, APP_JWT_SECRET, APP_CORS_ALLOWED_ORIGINS
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
