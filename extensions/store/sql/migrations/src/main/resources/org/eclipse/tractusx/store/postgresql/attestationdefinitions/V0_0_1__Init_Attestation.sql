/*
 * Copyright (c) 2025 Cofinity-X
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
CREATE TABLE IF NOT EXISTS attestation_definitions
(
    id                           VARCHAR    NOT NULL        ,
    participant_context_id       VARCHAR    NOT NULL        ,
    attestation_type             VARCHAR    NOT NULL        ,
    configuration                JSON       DEFAULT '{}'    ,
    created_date                 BIGINT     NOT NULL        ,
    last_modified_date           BIGINT     NOT NULL        ,
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS attestation_definition_ix
    ON attestation_definitions (id);
