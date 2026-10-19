#!/usr/bin/env bash
# Genera una nueva clave de acceso para NeuroLens y la imprime.
# Al rotar, todas las sesiones abiertas se cierran.
#   Rotar a mano:   ~/neurolens/scripts/rotar-clave.sh
#   Ver la vigente: cat ~/neurolens/acceso/clave
#   Rotación diaria (crontab -e):  0 5 * * * $HOME/neurolens/scripts/rotar-clave.sh >/dev/null
set -euo pipefail
dir="$(cd "$(dirname "$0")/.." && pwd)/acceso"
mkdir -p "$dir" && chmod 700 "$dir"

# 12 caracteres sin ambiguos (sin 0/O, 1/I/L) ≈ 60 bits, en 3 bloques fáciles de dictar
# (tr termina con SIGPIPE cuando head ya tiene lo suyo: es esperado, de ahí el "|| true")
clave=$( (LC_ALL=C tr -dc 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' </dev/urandom || true) | head -c 12 | sed 's/.\{4\}/&-/g; s/-$//')

umask 077
printf '%s\n' "$clave" > "$dir/clave.tmp"
mv "$dir/clave.tmp" "$dir/clave"          # reemplazo atómico: el backend nunca lee un archivo a medias
echo "$clave"
