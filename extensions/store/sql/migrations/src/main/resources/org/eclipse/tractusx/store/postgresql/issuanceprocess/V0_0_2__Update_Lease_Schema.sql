/*
 * Copyright (c) 2025 Cofinity-X
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

-- EDC 0.15.1: The lease mechanism was redesigned.
-- Old: edc_lease had a single-column PK (lease_id), data tables held a FK (lease_id) to it.
-- New: edc_lease uses a composite PK (resource_id, resource_kind), data tables no longer hold a FK.
--
-- This migration:
--   1. Drops FK constraint and lease_id column from edc_issuance_process
--   2. Drops and recreates the shared edc_lease table with the new schema
--      (idempotent — may already be done by the credentialrequest migration)

-- Step 1: Remove FK constraint from issuance_process
ALTER TABLE edc_issuance_process DROP CONSTRAINT IF EXISTS issuance_process_lease_lease_id_fk;

-- Step 2: Remove lease_id column from issuance_process
ALTER TABLE edc_issuance_process DROP COLUMN IF EXISTS lease_id;

-- Step 3: Drop old lease table if it still has the old schema (CASCADE for safety)
DROP INDEX IF EXISTS lease_lease_id_uindex;
DROP TABLE IF EXISTS edc_lease CASCADE;

-- Step 4: Recreate lease table with new composite PK schema (idempotent)
CREATE TABLE IF NOT EXISTS edc_lease
(
    leased_by     VARCHAR NOT NULL,
    leased_at     BIGINT,
    lease_duration INTEGER NOT NULL,
    resource_id   VARCHAR NOT NULL,
    resource_kind VARCHAR NOT NULL,
    PRIMARY KEY (resource_id, resource_kind)
);

COMMENT ON COLUMN edc_lease.leased_at IS 'posix timestamp of lease';
COMMENT ON COLUMN edc_lease.lease_duration IS 'duration of lease in milliseconds';
