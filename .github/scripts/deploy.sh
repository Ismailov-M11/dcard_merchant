#!/usr/bin/env bash
set -e

SERVICE_HOME="$1"

WEBROOT="${SERVICE_HOME}/www"
STAGING="${SERVICE_HOME}/dist"

[ -d "${WEBROOT}" ] && mv "${WEBROOT}" "${WEBROOT}_backup"
mv "${STAGING}" "${WEBROOT}"
rm -rf "${WEBROOT}_backup"

echo "Deployed → ${WEBROOT}"