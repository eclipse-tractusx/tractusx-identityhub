/*
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 VDBP
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

-- Stop all old writers before upgrading: RC5 no longer coordinates leases through edc_lease.
ALTER TABLE edc_issuance_process
    ADD COLUMN IF NOT EXISTS leased_by VARCHAR,
    ADD COLUMN IF NOT EXISTS leased_at BIGINT,
    ADD COLUMN IF NOT EXISTS lease_duration INTEGER,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- The historic issuance_process_state name can belong to the Holder table in a shared schema.
CREATE INDEX IF NOT EXISTS issuance_process_state_timestamp
    ON edc_issuance_process (state, state_time_stamp);
CREATE UNIQUE INDEX IF NOT EXISTS issuance_process_holder_pid
    ON edc_issuance_process (participant_context_id, holder_pid);
