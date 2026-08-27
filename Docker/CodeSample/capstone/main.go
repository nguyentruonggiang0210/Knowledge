package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	version = "dev"
	commit  = "none"
)

type config struct {
	addr           string
	databaseURL    string
	connectTimeout time.Duration
	shutdownTime   time.Duration
}

type application struct {
	db       *sql.DB
	logger   *log.Logger
	started  time.Time
	requests atomic.Uint64
}

type visit struct {
	ID        int64     `json:"id"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

func main() {
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime|log.LUTC)
	cfg, err := loadConfig()
	if err != nil {
		logger.Fatalf("configuration error: %v", err)
	}

	rootCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := connectDB(rootCtx, cfg.databaseURL, cfg.connectTimeout, logger)
	if err != nil {
		logger.Fatalf("database unavailable: %v", err)
	}
	defer db.Close()

	if err := migrate(rootCtx, db); err != nil {
		logger.Fatalf("database migration failed: %v", err)
	}

	app := &application{db: db, logger: logger, started: time.Now().UTC()}
	server := &http.Server{
		Addr:              cfg.addr,
		Handler:           app.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Printf("event=server_start addr=%q version=%q commit=%q", cfg.addr, version, commit)
		err := server.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
		close(serverErrors)
	}()

	select {
	case err := <-serverErrors:
		if err != nil {
			logger.Printf("event=server_error error=%q", err)
		}
	case <-rootCtx.Done():
		logger.Printf("event=shutdown_requested")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.shutdownTime)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Printf("event=shutdown_forced error=%q", err)
		_ = server.Close()
	}
	logger.Printf("event=server_stopped")
}

func loadConfig() (config, error) {
	connectTimeout, err := durationEnv("DB_CONNECT_TIMEOUT", 30*time.Second)
	if err != nil {
		return config{}, err
	}
	shutdownTime, err := durationEnv("SHUTDOWN_TIMEOUT", 10*time.Second)
	if err != nil {
		return config{}, err
	}

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		databaseURL = databaseURLFromParts(
			getenv("DB_HOST", "db"),
			getenv("DB_PORT", "5432"),
			getenv("DB_USER", "app"),
			getenv("DB_PASSWORD", "change-me"),
			getenv("DB_NAME", "app"),
			getenv("DB_SSLMODE", "disable"),
		)
	}

	return config{
		addr:           getenv("APP_ADDR", ":8080"),
		databaseURL:    databaseURL,
		connectTimeout: connectTimeout,
		shutdownTime:   shutdownTime,
	}, nil
}

func databaseURLFromParts(host, port, user, password, database, sslMode string) string {
	query := url.Values{}
	query.Set("sslmode", sslMode)
	u := &url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(user, password),
		Host:     net.JoinHostPort(host, port),
		Path:     "/" + database,
		RawQuery: query.Encode(),
	}
	return u.String()
}

func durationEnv(name string, fallback time.Duration) (time.Duration, error) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback, nil
	}
	value, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("%s must be a duration: %w", name, err)
	}
	return value, nil
}

func getenv(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func connectDB(ctx context.Context, databaseURL string, timeout time.Duration, logger *log.Logger) (*sql.DB, error) {
	deadline := time.Now().Add(timeout)
	var lastErr error
	for attempt := 1; ; attempt++ {
		db, err := sql.Open("pgx", databaseURL)
		if err == nil {
			db.SetMaxOpenConns(10)
			db.SetMaxIdleConns(5)
			db.SetConnMaxLifetime(30 * time.Minute)

			pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
			err = db.PingContext(pingCtx)
			cancel()
			if err == nil {
				logger.Printf("event=database_connected attempt=%d", attempt)
				return db, nil
			}
			_ = db.Close()
		}
		lastErr = err

		if time.Now().After(deadline) {
			return nil, fmt.Errorf("connect timeout after %s: %w", timeout, lastErr)
		}
		logger.Printf("event=database_retry attempt=%d error=%q", attempt, lastErr)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Second):
		}
	}
}

func migrate(ctx context.Context, db *sql.DB) error {
	const statement = `
CREATE TABLE IF NOT EXISTS visits (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`
	_, err := db.ExecContext(ctx, statement)
	return err
}

func (app *application) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", app.index)
	mux.HandleFunc("/healthz", app.health)
	mux.HandleFunc("/readyz", app.ready)
	mux.HandleFunc("/metrics", app.metrics)
	mux.HandleFunc("/visits", app.visits)
	return app.accessLog(app.recoverPanic(mux))
}

func (app *application) index(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		app.writeError(w, http.StatusNotFound, "not found")
		return
	}
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w, http.MethodGet)
		return
	}
	app.writeJSON(w, http.StatusOK, map[string]any{
		"service": "visits-api",
		"version": version,
		"commit":  commit,
		"links":   []string{"/healthz", "/readyz", "/metrics", "/visits"},
	})
}

func (app *application) health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w, http.MethodGet)
		return
	}
	app.writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (app *application) ready(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w, http.MethodGet)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), time.Second)
	defer cancel()
	if err := app.db.PingContext(ctx); err != nil {
		app.writeError(w, http.StatusServiceUnavailable, "database is not ready")
		return
	}
	app.writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (app *application) metrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		app.methodNotAllowed(w, http.MethodGet)
		return
	}
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	uptime := time.Since(app.started).Seconds()
	_, _ = fmt.Fprintf(w, "# HELP app_http_requests_total HTTP requests observed by the process.\n")
	_, _ = fmt.Fprintf(w, "# TYPE app_http_requests_total counter\n")
	_, _ = fmt.Fprintf(w, "app_http_requests_total %d\n", app.requests.Load())
	_, _ = fmt.Fprintf(w, "# HELP app_uptime_seconds Process uptime in seconds.\n")
	_, _ = fmt.Fprintf(w, "# TYPE app_uptime_seconds gauge\n")
	_, _ = fmt.Fprintf(w, "app_uptime_seconds %.3f\n", uptime)
}

func (app *application) visits(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		app.listVisits(w, r)
	case http.MethodPost:
		app.createVisit(w, r)
	default:
		w.Header().Set("Allow", "GET, POST")
		app.writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (app *application) listVisits(w http.ResponseWriter, r *http.Request) {
	rows, err := app.db.QueryContext(r.Context(), `
SELECT id, message, created_at
FROM visits
ORDER BY id DESC
LIMIT 100`)
	if err != nil {
		app.serverError(w, err)
		return
	}
	defer rows.Close()

	items := make([]visit, 0)
	for rows.Next() {
		var item visit
		if err := rows.Scan(&item.ID, &item.Message, &item.CreatedAt); err != nil {
			app.serverError(w, err)
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		app.serverError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, map[string]any{"visits": items})
}

func (app *application) createVisit(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Message string `json:"message"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&input); err != nil {
		app.writeError(w, http.StatusBadRequest, "body must be valid JSON with a message field")
		return
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		app.writeError(w, http.StatusBadRequest, "body must contain one JSON object")
		return
	}
	input.Message = strings.TrimSpace(input.Message)
	if input.Message == "" || len([]rune(input.Message)) > 200 {
		app.writeError(w, http.StatusUnprocessableEntity, "message must contain 1-200 characters")
		return
	}

	var item visit
	err := app.db.QueryRowContext(r.Context(), `
INSERT INTO visits (message)
VALUES ($1)
RETURNING id, message, created_at`, input.Message).Scan(&item.ID, &item.Message, &item.CreatedAt)
	if err != nil {
		app.serverError(w, err)
		return
	}
	app.writeJSON(w, http.StatusCreated, item)
}

func (app *application) accessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		app.requests.Add(1)
		next.ServeHTTP(w, r)
		app.logger.Printf("event=request method=%q path=%q remote=%q duration_ms=%d", r.Method, r.URL.Path, r.RemoteAddr, time.Since(started).Milliseconds())
	})
}

func (app *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				app.logger.Printf("event=panic value=%q", fmt.Sprint(recovered))
				app.writeError(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (app *application) serverError(w http.ResponseWriter, err error) {
	app.logger.Printf("event=server_error error=%q", err)
	app.writeError(w, http.StatusInternalServerError, "internal server error")
}

func (app *application) methodNotAllowed(w http.ResponseWriter, allowed string) {
	w.Header().Set("Allow", allowed)
	app.writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}

func (app *application) writeError(w http.ResponseWriter, status int, message string) {
	app.writeJSON(w, status, map[string]string{"error": message})
}

func (app *application) writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		app.logger.Printf("event=response_encode_error error=%q", err)
	}
}
