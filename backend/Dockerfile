# syntax=docker/dockerfile:1
# ---- Build stage: compile and package the Spring Boot jar (JDK 21) ----
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -q -DskipTests package

# ---- Runtime stage: slim JRE, non-root user ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home --uid 10001 scopeledger
COPY --from=build /app/target/*.jar /app/app.jar
USER scopeledger

# The platform provides PORT (default 8080). Configuration comes from environment variables:
# DB_URL, DB_USER, DB_PASS, CORS_ORIGINS, DEMO_RESET_ENABLED (see DEPLOYMENT.md).
EXPOSE 8080
# Cap heap relative to the container limit so small free-tier instances are not OOM-killed.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
