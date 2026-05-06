#################################################################################
# Copyright (c) 2026 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

# Stage 1: Build the React app
FROM node:lts-alpine3.23 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --include=dev --ignore-scripts --prefer-offline

COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

ENV NODE_ENV=production

RUN npm run build


# Stage 2: Serve the app with Nginx
FROM nginxinc/nginx-unprivileged:alpine3.22

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

USER root

RUN apk update --no-cache

# Rename index.html to index.html.reference for env injection
RUN mv /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.reference \
    && ln -s /tmp/index.html /usr/share/nginx/html/index.html

COPY ./scripts/inject-dynamic-env.sh /docker-entrypoint.d/00-inject-dynamic-env.sh
RUN chmod +x /docker-entrypoint.d/00-inject-dynamic-env.sh \
    && chown -R 101:101 /usr/share/nginx/html/

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]
