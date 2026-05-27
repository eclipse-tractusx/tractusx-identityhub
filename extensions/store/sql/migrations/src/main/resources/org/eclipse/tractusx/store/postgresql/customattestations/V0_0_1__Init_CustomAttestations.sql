/*
 * Copyright (c) 2025 LKS Next
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

-- only intended for and tested with Postgres!
CREATE TABLE IF NOT EXISTS custom_attestation_claims
(
    holder_id              VARCHAR PRIMARY KEY NOT NULL, -- ID of the Holder (matches participant context)
    holder_identifier VARCHAR(255),
    member_of VARCHAR(255),
    bpn VARCHAR(50),
    -- Categorization (Renamed from group and userCase)
    group_name VARCHAR(100),
    use_case TEXT,
    -- Contract Metadata
    contract_template VARCHAR(255),
    contract_version VARCHAR(50),
    created_date           BIGINT NOT NULL,              -- POSIX timestamp of creation
    last_modified_date     BIGINT                        -- POSIX timestamp of last modification
);

CREATE INDEX IF NOT EXISTS custom_attestation_holder_idx
    ON custom_attestation_claims(holder_id);

COMMENT ON TABLE custom_attestation_claims IS 'Custom attestation claims for credential issuance. Add/remove columns as needed for your custom claims.';
COMMENT ON COLUMN custom_attestation_claims.holder_id IS 'Must match the holder ID used in credential issuance requests';
