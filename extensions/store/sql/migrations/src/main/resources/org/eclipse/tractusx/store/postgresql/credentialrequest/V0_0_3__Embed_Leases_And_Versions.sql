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
ALTER TABLE edc_holder_credentialrequest
    ADD COLUMN IF NOT EXISTS leased_by VARCHAR,
    ADD COLUMN IF NOT EXISTS leased_at BIGINT,
    ADD COLUMN IF NOT EXISTS lease_duration INTEGER,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE edc_credential_offers
    ADD COLUMN IF NOT EXISTS leased_by VARCHAR,
    ADD COLUMN IF NOT EXISTS leased_at BIGINT,
    ADD COLUMN IF NOT EXISTS lease_duration INTEGER,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS holder_credentialrequest_state
    ON edc_holder_credentialrequest (state, state_time_stamp);
