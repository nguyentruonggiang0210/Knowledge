package main

import (
	"net/url"
	"testing"
	"time"
)

func TestDatabaseURLFromPartsEscapesCredentials(t *testing.T) {
	raw := databaseURLFromParts("postgres.internal", "5432", "app", "p@ss:/word", "visits", "require")
	parsed, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("parse URL: %v", err)
	}
	password, ok := parsed.User.Password()
	if !ok || password != "p@ss:/word" {
		t.Fatalf("password was not preserved safely: %q", password)
	}
	if got := parsed.Query().Get("sslmode"); got != "require" {
		t.Fatalf("sslmode = %q, want require", got)
	}
}

func TestDurationEnv(t *testing.T) {
	t.Setenv("TEST_DURATION", "250ms")
	got, err := durationEnv("TEST_DURATION", time.Second)
	if err != nil {
		t.Fatalf("durationEnv returned error: %v", err)
	}
	if got != 250*time.Millisecond {
		t.Fatalf("duration = %s, want 250ms", got)
	}
}
