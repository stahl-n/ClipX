#!/bin/sh
chown -R app:app /app/uploads
exec su-exec app "$@"