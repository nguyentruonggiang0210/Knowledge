#!/usr/bin/env bash

# Read-only snapshot for a Linux learning sandbox. It deliberately avoids secrets,
# full environment dumps and destructive remediation.
set -u

section() {
  printf '\n== %s ==\n' "$1"
}

run_if_available() {
  command_name="$1"
  shift
  if command -v "$command_name" >/dev/null 2>&1; then
    "$command_name" "$@" || true
  else
    printf 'skip: %s is not installed\n' "$command_name"
  fi
}

section "Identity and kernel"
hostname
uname -a
id
uptime

section "Clock"
run_if_available timedatectl

section "Filesystem capacity"
df -hP
df -iP
run_if_available findmnt

section "Memory and pressure"
run_if_available free -h
for pressure_file in /proc/pressure/cpu /proc/pressure/memory /proc/pressure/io; do
  if [[ -r "$pressure_file" ]]; then
    printf '%s\n' "$pressure_file"
    sed -n '1,2p' "$pressure_file"
  fi
done

section "Top processes"
ps -eo pid,ppid,user,stat,%cpu,%mem,cmd --sort=-%cpu | sed -n '1,11p'

section "Listening sockets"
if command -v ss >/dev/null 2>&1; then
  ss -lntup || true
else
  printf 'skip: ss is not installed\n'
fi

section "Failed systemd units"
if command -v systemctl >/dev/null 2>&1; then
  systemctl --failed --no-pager || true
else
  printf 'skip: systemctl is not installed\n'
fi

section "Recent kernel warnings"
if command -v journalctl >/dev/null 2>&1; then
  journalctl -k -p warning --since "-30 min" --no-pager | tail -n 50 || true
else
  dmesg 2>/dev/null | tail -n 50 || true
fi

printf '\nAudit complete. Interpret this snapshot with workload trends and user symptoms.\n'
