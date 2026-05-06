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

-- EDC 0.15.1: The lease mechanism was redesigned.
-- Old: edc_lease had a single-column PK (lease_id), data tables held a FK (lease_id) to it.
-- New: edc_lease uses a composite PK (resource_id, resource_kind), data tables no longer hold a FK.
--
-- This migration only cleans up the issuance_process side (FK + lease_id column).
-- The shared edc_lease table is recreated by the credentialrequest V0_0_2 migration,
-- which runs against the same datasource. Either ordering is safe:
--   * If credentialrequest runs first: edc_lease already has the new schema; this script
--     just drops the FK constraint (already removed by CASCADE) and the lease_id column.
--   * If issuanceprocess runs first: lease_id is dropped here, edc_lease is left with the
--     old schema, and credentialrequest's migration replaces it with the new schema.
-- Keeping the table redesign in a single script avoids double DROP TABLE CASCADE on a
-- shared table.

-- Step 1: Remove FK constraint from issuance_process
ALTER TABLE edc_issuance_process DROP CONSTRAINT IF EXISTS issuance_process_lease_lease_id_fk;

-- Step 2: Remove lease_id column from issuance_process
ALTER TABLE edc_issuance_process DROP COLUMN IF EXISTS lease_id;
