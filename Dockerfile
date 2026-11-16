# syntax=docker/dockerfile:1

# ---------- Stage 1: build the React app ----------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: build the Spring Boot jar, with the React build inside it ----------
FROM eclipse-temurin:21-jdk-alpine AS backend
WORKDIR /app
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
# Windows checkouts can give mvnw CRLF line endings, which Linux cannot run
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY backend/src src
COPY --from=frontend /app/dist src/main/resources/static
RUN ./mvnw -B -q -DskipTests package

# ---------- Stage 3: small runtime image ----------
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
USER app
# Tuned for a 512 MB container: serial GC, C1-only JIT for fast startup on a tiny CPU
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]