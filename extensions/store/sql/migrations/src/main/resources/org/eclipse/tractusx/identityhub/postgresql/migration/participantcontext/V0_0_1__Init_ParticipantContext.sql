/*
 *   Copyright (c) 2025 Cofinity-X
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
CREATE TABLE IF NOT EXISTS participant_context
(
    participant_context_id     VARCHAR PRIMARY KEY NOT NULL, -- ID of the ParticipantContext
    created_date       BIGINT              NOT NULL, -- POSIX timestamp of the creation of the PC
    last_modified_date BIGINT,                       -- POSIX timestamp of the last modified date
    state              INTEGER             NOT NULL, -- 0 = CREATED, 1 = ACTIVE, 2 = DEACTIVATED
    api_token_alias    VARCHAR             NOT NULL, -- alias under which this PC's api token is stored in the vault
    did                VARCHAR,                      -- the DID with which this participant is identified
    roles              JSON,                         -- JSON array containing all the roles a user has. may be empty
    properties         JSON DEFAULT '{}'             -- JSON object containing additional information, such as OAuth2 client secret aliases
);
CREATE UNIQUE INDEX IF NOT EXISTS participant_context_participant_context_id_uindex ON participant_context USING btree (participant_context_id);

