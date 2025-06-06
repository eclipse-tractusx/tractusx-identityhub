/*
 *   Copyright (c) 2025 Cofinity-X
 *   Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *
 *   This program and the accompanying materials are made available under the
 *   terms of the Apache License, Version 2.0 which is available at
 *   https://www.apache.org/licenses/LICENSE-2.0.
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *   WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *   License for the specific language governing permissions and limitations
 *   under the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 *
 */

-- only intended for and tested with Postgres!
CREATE TABLE IF NOT EXISTS credential_resource
(
    id                    VARCHAR PRIMARY KEY NOT NULL, -- ID of the VC, duplicated here for indexing purposes
    create_timestamp      BIGINT              NOT NULL, -- POSIX timestamp of the creation of the VC
    issuer_id             VARCHAR             NOT NULL,
    holder_id             VARCHAR             NOT NULL,
    vc_state              INTEGER             NOT NULL,
    issuance_policy       JSON,
    reissuance_policy     JSON,
    raw_vc                VARCHAR             NOT NULL, -- Representation of the VC exactly as it was received by the issuer. Can be JWT or JSON(-LD)
    vc_format             INTEGER             NOT NULL, -- 0 = JSON-LD, 1 = JWT
    verifiable_credential JSON                NOT NULL, -- JSON-representation of the verifiable credential
    participant_context_id        VARCHAR                       -- ID of the ParticipantContext that owns this credentisl
);
CREATE UNIQUE INDEX IF NOT EXISTS credential_resource_credential_id_uindex ON credential_resource USING btree (id);
COMMENT ON COLUMN credential_resource.id IS 'ID of the VC, duplicated here for indexing purposes';
COMMENT ON COLUMN credential_resource.raw_vc IS 'Representation of the VC exactly as it was received by the issuer. Can be JWT or JSON(-LD) ';
COMMENT ON COLUMN credential_resource.vc_format IS '0 = JSON-LD, 1 = JWT';
COMMENT ON COLUMN credential_resource.verifiable_credential IS 'JSON-representation of the VerifiableCredential';

