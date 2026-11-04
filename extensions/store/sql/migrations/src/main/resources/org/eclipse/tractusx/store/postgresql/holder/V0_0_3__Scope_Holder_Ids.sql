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

ALTER TABLE holders DROP CONSTRAINT holders_pkey;
DROP INDEX IF EXISTS holders_holder_id_uindex;
ALTER TABLE holders ADD CONSTRAINT holders_participant_id_pk PRIMARY KEY (participant_context_id, holder_id);

-- Preserve existing duplicate DID registrations, matching the upstream RC5 compatibility behavior.
DO
$$
BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS holders_participant_did ON holders (participant_context_id, did);
EXCEPTION
    WHEN unique_violation THEN
        RAISE WARNING 'Index holders_participant_did not created: a participant context has several holders with the same DID';
END
$$;
