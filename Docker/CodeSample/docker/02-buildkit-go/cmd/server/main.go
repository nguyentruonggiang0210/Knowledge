package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

type logEvent struct {
	Time    string `json:"time"`
	Level   string `json:"level"`
	Event   string `json:"event"`
	Method  string `json:"method,omitempty"`
	Path    string `json:"path,omitempty"`
	Status  int    `json:"status,omitempty"`
	Latency int64  `json:"latency_ms,omitempty"`
}

func logJSON(event logEvent) {
	event.Time = time.Now().UTC().Format(time.RFC3339Nano)
	_ = json.NewEncoder(os.Stdout).Encode(event)
}

func healthcheck() int {
	client := http.Client{Timeout: 1500 * time.Millisecond}
	resp, err := client.Get("http://127.0.0.1:8080/healthz")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

func logged(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		logJSON(logEvent{Level: "info", Event: "request", Method: r.Method, Path: r.URL.Path, Status: 200, Latency: time.Since(started).Milliseconds()})
	})
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		os.Exit(healthcheck())
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"message":"hello from a multi-stage image"}`))
	})
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("GET /work", func(w http.ResponseWriter, r *http.Request) {
		ms, _ := strconv.Atoi(r.URL.Query().Get("ms"))
		if ms < 0 || ms > 5000 {
			http.Error(w, "ms must be between 0 and 5000", http.StatusBadRequest)
			return
		}
		select {
		case <-time.After(time.Duration(ms) * time.Millisecond):
			_, _ = w.Write([]byte("done"))
		case <-r.Context().Done():
		}
	})

	server := &http.Server{
		Addr:              ":8080",
		Handler:           logged(mux),
		ReadHeaderTimeout: 3 * time.Second,
		IdleTimeout:       30 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		logJSON(logEvent{Level: "info", Event: "server_started"})
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logJSON(logEvent{Level: "error", Event: "server_failed"})
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	logJSON(logEvent{Level: "info", Event: "shutdown_started"})
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logJSON(logEvent{Level: "error", Event: "shutdown_failed"})
		os.Exit(1)
	}
	logJSON(logEvent{Level: "info", Event: "shutdown_completed"})
}
