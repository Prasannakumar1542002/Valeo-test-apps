# Step 1: Use an official Maven image to build the JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Use a lightweight Java Runtime image to run the JAR
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# Run the application and bind it to the dynamic port assigned by Render
CMD ["java", "-jar", "app.jar", "--server.port=${PORT:8080}"]