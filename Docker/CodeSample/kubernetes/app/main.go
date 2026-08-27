package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync/atomic"
	"syscall"
	"time"
)

var (
	ready        atomic.Bool
	requestCount atomic.Uint64
	startedAt    = time.Now()
)

type response struct {
	Hostname string `json:"hostname"`
	Message  string `json:"message"`
	Version  string `json:"version"`
	Time     string `json:"time"`
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func logEvent(event string, fields map[string]any) {
	entry := map[string]any{
		"time":  time.Now().UTC().Format(time.RFC3339Nano),
		"event": event,
	}
	for key, value := range fields {
		entry[key] = value
	}
	payload, err := json.Marshal(entry)
	if err != nil {
		log.Printf("log marshal error: %v", err)
		return
	}
	fmt.Println(string(payload))
}

func main() {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response{
			Hostname: hostname,
			Message:  getenv("APP_MESSAGE", "hello-kubernetes"),
			Version:  getenv("APP_VERSION", "dev"),
			Time:     time.Now().UTC().Format(time.RFC3339Nano),
		})
	})
	mux.HandleFunc("/livez", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok\n"))
	})
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, _ *http.Request) {
		if !ready.Load() {
			http.Error(w, "not ready", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ready\n"))
	})
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		_, _ = fmt.Fprintf(w, "# HELP sample_api_requests_total Total HTTP requests observed.\n")
		_, _ = fmt.Fprintf(w, "# TYPE sample_api_requests_total counter\n")
		_, _ = fmt.Fprintf(w, "sample_api_requests_total %d\n", requestCount.Load())
		_, _ = fmt.Fprintf(w, "# HELP sample_api_uptime_seconds Process uptime.\n")
		_, _ = fmt.Fprintf(w, "# TYPE sample_api_uptime_seconds gauge\n")
		_, _ = fmt.Fprintf(w, "sample_api_uptime_seconds %.0f\n", time.Since(startedAt).Seconds())
	})

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount.Add(1)
		start := time.Now()
		mux.ServeHTTP(w, r)
		logEvent("http_request", map[string]any{
			"method":      r.Method,
			"path":        r.URL.Path,
			"duration_ms": time.Since(start).Milliseconds(),
		})
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ready.Store(true)
	go func() {
		logEvent("server_started", map[string]any{"address": server.Addr, "version": getenv("APP_VERSION", "dev")})
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	sig := <-stop
	ready.Store(false)
	logEvent("shutdown_started", map[string]any{"signal": sig.String()})

	drainSeconds, err := strconv.Atoi(getenv("DRAIN_SECONDS", "3"))
	if err != nil || drainSeconds < 0 || drainSeconds > 20 {
		drainSeconds = 3
	}
	time.Sleep(time.Duration(drainSeconds) * time.Second)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		logEvent("shutdown_forced", map[string]any{"error": err.Error()})
		_ = server.Close()
	}
	logEvent("shutdown_complete", nil)
}
