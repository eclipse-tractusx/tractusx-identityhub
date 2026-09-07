/*
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

-- Reject malformed permission data before changing any participant.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM participant_context
        WHERE properties IS NOT NULL AND jsonb_typeof(properties::jsonb) <> 'object'
    ) THEN
        RAISE EXCEPTION 'Participant properties must be JSON objects before migrating scopes.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM participant_context,
            LATERAL jsonb_each(COALESCE(properties::jsonb, '{}'::jsonb)) AS property
        WHERE property.key IN ('roles', 'scopes')
            AND jsonb_typeof(property.value) NOT IN ('array', 'null')
    ) THEN
        RAISE EXCEPTION 'Participant roles and scopes must be arrays of strings before migrating scopes.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM participant_context,
            LATERAL jsonb_each(COALESCE(properties::jsonb, '{}'::jsonb)) AS property,
            LATERAL jsonb_array_elements(
                CASE WHEN jsonb_typeof(property.value) = 'array' THEN property.value ELSE '[]'::jsonb END
            ) AS entry
        WHERE property.key IN ('roles', 'scopes') AND jsonb_typeof(entry.value) <> 'string'
    ) THEN
        RAISE EXCEPTION 'Participant roles and scopes must contain only strings before migrating scopes.';
    END IF;
END $$;

-- Only built-in legacy roles grant permissions. Existing scopes remain intact.
UPDATE participant_context AS participant
SET properties = (COALESCE(participant.properties::jsonb, '{}'::jsonb) - 'roles') || jsonb_build_object(
    'scopes', (
        SELECT COALESCE(jsonb_agg(scope ORDER BY scope), '[]'::jsonb)
        FROM (
            SELECT value AS scope
            FROM jsonb_array_elements_text(COALESCE(NULLIF(participant.properties::jsonb -> 'scopes', 'null'::jsonb), '[]'::jsonb))
            UNION
            SELECT mapping.scope
            FROM jsonb_array_elements_text(COALESCE(NULLIF(participant.properties::jsonb -> 'roles', 'null'::jsonb), '[]'::jsonb)) AS role
            JOIN (VALUES
                ('admin', 'identity-api:admin'),
                ('admin', 'issuer-admin-api:admin'),
                ('participant', 'identity-api:write'),
                ('participant', 'issuer-admin-api:write')
            ) AS mapping(role, scope) ON role.value = mapping.role
        ) AS granted
    )
);
