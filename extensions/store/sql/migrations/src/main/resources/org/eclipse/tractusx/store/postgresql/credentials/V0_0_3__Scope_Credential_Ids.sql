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

-- Never invent an owner for legacy credentials; missing owners require operator reconciliation.
ALTER TABLE credential_resource ALTER COLUMN participant_context_id SET NOT NULL;
ALTER TABLE credential_resource DROP CONSTRAINT credential_resource_pkey;
DROP INDEX IF EXISTS credential_resource_credential_id_uindex;
ALTER TABLE credential_resource
    ADD CONSTRAINT credential_resource_participant_id_pk PRIMARY KEY (participant_context_id, id);
CREATE INDEX IF NOT EXISTS credential_resource_participant_usage_state
    ON credential_resource (participant_context_id, usage, vc_state);
