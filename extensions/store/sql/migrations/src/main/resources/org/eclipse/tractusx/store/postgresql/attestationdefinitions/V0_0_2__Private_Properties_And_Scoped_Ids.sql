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

ALTER TABLE attestation_definitions ADD COLUMN IF NOT EXISTS private_properties JSON DEFAULT '{}';
ALTER TABLE attestation_definitions DROP CONSTRAINT attestation_definitions_pkey;
DROP INDEX IF EXISTS attestation_definition_ix;
ALTER TABLE attestation_definitions
    ADD CONSTRAINT attestation_definitions_participant_id_pk PRIMARY KEY (participant_context_id, id);
