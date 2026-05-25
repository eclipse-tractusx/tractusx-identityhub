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

-- Step 1: add the new identity column. Idempotent on its own (IF NOT EXISTS).
ALTER TABLE participant_context ADD COLUMN IF NOT EXISTS identity VARCHAR;

-- Step 2: the remaining steps reference the legacy `did`, `api_token_alias`, and
-- `roles` columns. In normal Flyway operation each migration runs in a transaction
-- and is recorded on success, so this body cannot be re-entered. The guard below
-- only matters in edge cases (manual rerun, repaired Flyway history, restored
-- snapshot) — in those, detecting that `did` has already been dropped lets us
-- short-circuit cleanly with a NOTICE rather than failing on a missing column.
DO $$
DECLARE
  duplicate_count INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'participant_context'
       AND column_name = 'did'
  ) THEN
    RAISE NOTICE 'V0_0_2: legacy ''did'' column already absent; assuming migration already applied. Skipping body.';
    RETURN;
  END IF;

  -- Backfill identity from did
  UPDATE participant_context
     SET identity = did
   WHERE identity IS NULL AND did IS NOT NULL;

  -- Defensive: ensure identity is populated for any legacy row missing did
  -- (V0_0_1 did not enforce NOT NULL on the did column).
  UPDATE participant_context
     SET identity = participant_context_id
   WHERE identity IS NULL;

  -- V0_0_1 did not enforce uniqueness on the did column, so the backfill above could
  -- produce duplicate identity values in deployments that allowed duplicate DIDs.
  -- The new schema requires identity UNIQUE NOT NULL, so fail loudly with a clear,
  -- actionable message rather than letting ADD CONSTRAINT fail cryptically.
  SELECT COUNT(*) INTO duplicate_count
    FROM (
      SELECT identity
        FROM participant_context
       WHERE identity IS NOT NULL
       GROUP BY identity
      HAVING COUNT(*) > 1
    ) AS dups;
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'V0_0_2 migration: % duplicate identity value(s) detected in participant_context (backfilled from the did column, which V0_0_1 did not enforce as UNIQUE). Resolve duplicates before retrying.', duplicate_count;
  END IF;

  -- Move apiTokenAlias and roles into the properties JSON column
  UPDATE participant_context
     SET properties = COALESCE(properties::jsonb, '{}'::jsonb)
                      || jsonb_build_object('apiTokenAlias', api_token_alias)
                      || jsonb_build_object('roles', COALESCE(roles::jsonb, '[]'::jsonb))
   WHERE api_token_alias IS NOT NULL OR roles IS NOT NULL;

  ALTER TABLE participant_context ALTER COLUMN identity SET NOT NULL;

  -- Postgres has no ADD CONSTRAINT IF NOT EXISTS; emulate via pg_constraint so
  -- this step is safe on partial reruns / restored snapshots even when did is
  -- still present.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participant_context_identity_unique'
  ) THEN
    ALTER TABLE participant_context
      ADD CONSTRAINT participant_context_identity_unique UNIQUE (identity);
  END IF;

  ALTER TABLE participant_context DROP COLUMN IF EXISTS api_token_alias;
  ALTER TABLE participant_context DROP COLUMN IF EXISTS did;
  ALTER TABLE participant_context DROP COLUMN IF EXISTS roles;
END $$;
