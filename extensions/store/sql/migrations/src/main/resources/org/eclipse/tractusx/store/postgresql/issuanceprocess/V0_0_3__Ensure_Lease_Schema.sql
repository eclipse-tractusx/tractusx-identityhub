/*
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 Technovative Solutions
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

-- Fixes https://github.com/eclipse-tractusx/tractusx-identityhub/issues/289
--
-- The issuanceprocess V0_0_2 migration only dropped the FK + lease_id column on the
-- issuance_process side and relied on the credentialrequest V0_0_2 migration in the
-- same datasource to recreate edc_lease with the EDC 0.15.1 composite-PK schema.
-- The issuerservice runtime does not deploy the credentialrequest store, so its
-- edc_lease remained in the legacy (lease_id PK) shape, causing every state-machine
-- tick to fail with: 'column l.resource_id does not exist'.
--
-- This migration is idempotent: it inspects information_schema and only recreates
-- edc_lease when the legacy shape is detected. On databases where edc_lease already
-- has the new composite-PK schema (e.g. identityhub, where credentialrequest V0_0_2
-- handled the recreate), it is a no-op.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'edc_lease'
          AND column_name = 'resource_id'
    ) THEN
        DROP INDEX IF EXISTS lease_lease_id_uindex;
        DROP TABLE IF EXISTS edc_lease CASCADE;

        CREATE TABLE edc_lease
        (
            leased_by      VARCHAR NOT NULL,
            leased_at      BIGINT,
            lease_duration INTEGER NOT NULL,
            resource_id    VARCHAR NOT NULL,
            resource_kind  VARCHAR NOT NULL,
            PRIMARY KEY (resource_id, resource_kind)
        );

        COMMENT ON COLUMN edc_lease.leased_at IS 'posix timestamp of lease';
        COMMENT ON COLUMN edc_lease.lease_duration IS 'duration of lease in milliseconds';
    END IF;
END
$$;
