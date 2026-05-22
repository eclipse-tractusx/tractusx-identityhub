/*
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
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

-- EDC 0.16.0: participant_context table schema changes (IH PR #875):
--   - Added column:   identity (UNIQUE NOT NULL) — replaces did
--   - Removed columns: api_token_alias, did, roles
--     (api_token_alias and roles are now stored in the properties JSON column)

ALTER TABLE participant_context ADD COLUMN IF NOT EXISTS identity VARCHAR;

UPDATE participant_context
   SET identity = did
 WHERE identity IS NULL AND did IS NOT NULL;

-- Defensive: ensure identity is populated for any legacy row missing did
-- (V0_0_1 did not enforce NOT NULL on the did column).
UPDATE participant_context
   SET identity = participant_context_id
 WHERE identity IS NULL;

UPDATE participant_context
   SET properties = COALESCE(properties::jsonb, '{}'::jsonb)
                    || jsonb_build_object('apiTokenAlias', api_token_alias)
                    || jsonb_build_object('roles', COALESCE(roles::jsonb, '[]'::jsonb))
 WHERE api_token_alias IS NOT NULL OR roles IS NOT NULL;

ALTER TABLE participant_context ALTER COLUMN identity SET NOT NULL;
ALTER TABLE participant_context ADD CONSTRAINT participant_context_identity_unique UNIQUE (identity);

ALTER TABLE participant_context DROP COLUMN IF EXISTS api_token_alias;
ALTER TABLE participant_context DROP COLUMN IF EXISTS did;
ALTER TABLE participant_context DROP COLUMN IF EXISTS roles;
