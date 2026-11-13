FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY src/TvWeb/TvWeb.csproj src/TvWeb/
RUN dotnet restore src/TvWeb/TvWeb.csproj
COPY . .
RUN dotnet publish src/TvWeb/TvWeb.csproj -c Release -o /app/publish
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV DB_PATH=/app/data/tvweb.db
VOLUME /app/data
ENTRYPOINT ["dotnet", "TvWeb.dll"]
