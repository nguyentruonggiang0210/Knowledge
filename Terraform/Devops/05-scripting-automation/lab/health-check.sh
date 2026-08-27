#!/usr/bin/env bash

set -Eeuo pipefail

url="${1:-}"
max_attempts="${2:-3}"

if [[ -z "$url" || ! "$max_attempts" =~ ^[1-9][0-9]*$ ]]; then
  printf 'usage: %s <https-url> [max-attempts]\n' "$0" >&2
  exit 2
fi

if [[ "$url" != https://* ]]; then
  printf 'configuration error: URL must use https\n' >&2
  exit 2
fi

for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  started_epoch="$(date +%s)"
  set +e
  status_code="$(curl --silent --show-error \
    --connect-timeout 3 --max-time 10 \
    --output /dev/null --write-out '%{http_code}' "$url")"
  curl_exit=$?
  set -e

  if ((curl_exit == 0)) && [[ "$status_code" =~ ^[23][0-9][0-9]$ ]]; then
    duration="$(( $(date +%s) - started_epoch ))"
    printf '{"event":"health_check","attempt":%d,"duration_seconds":%d,"status_code":%d,"status":"healthy"}\n' \
      "$attempt" "$duration" "$status_code"
    exit 0
  fi

  if ((curl_exit == 0)) \
    && [[ "$status_code" =~ ^4[0-9][0-9]$ ]] \
    && [[ "$status_code" != "408" && "$status_code" != "429" ]]; then
    printf '{"event":"health_check","attempt":%d,"status_code":%d,"status":"unhealthy"}\n' \
      "$attempt" "$status_code" >&2
    exit 3
  fi

  if ((attempt < max_attempts)); then
    delay="$(( 2 ** (attempt - 1) + RANDOM % 2 ))"
    printf '{"event":"health_check","attempt":%d,"status_code":"%s","curl_exit":%d,"status":"retry","delay_seconds":%d}\n' \
      "$attempt" "$status_code" "$curl_exit" "$delay" >&2
    sleep "$delay"
  fi
done

printf '{"event":"health_check","attempts":%d,"status":"unhealthy"}\n' "$max_attempts" >&2
exit 3
