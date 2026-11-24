--
-- Copyright (c) 2026 Contributors to the Eclipse Foundation
--
-- See the NOTICE file(s) distributed with this work for additional
-- information regarding copyright ownership.
--
-- This program and the accompanying materials are made available under the
-- terms of the Apache License, Version 2.0 which is available at
-- https://www.apache.org/licenses/LICENSE-2.0.
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
-- WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
-- License for the specific language governing permissions and limitations
-- under the License.
--
-- SPDX-License-Identifier: Apache-2.0
--

-- Backfill default configuration rows for existing participant contexts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'participant_context'
    ) THEN
        INSERT INTO edc_participant_context_config
          (participant_context_id, created_date, last_modified_date, entries, private_entries)
        SELECT participant_context_id,
               COALESCE(created_date, (extract(epoch from now())*1000)::bigint),
               COALESCE(last_modified_date, (extract(epoch from now())*1000)::bigint),
               '{}'::json,
               '{}'::json
        FROM participant_context
        ON CONFLICT (participant_context_id) DO NOTHING;
    END IF;
END $$;
