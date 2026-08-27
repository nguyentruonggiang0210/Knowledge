# Build first with: mvn package. Pin the image by digest in a real production repository.
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY target/classes/ /app/classes/
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-cp", "/app/classes", "course.networking.NetworkingDemo", "--serve"]
