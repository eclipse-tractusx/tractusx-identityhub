/*
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
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

-- EDC 0.15.1: holders table now requires:
--   - 'anonymous' column: indicates whether the holder was created during a credential request
--   - 'properties' column: JSON serialization of additional holder properties

ALTER TABLE holders ADD COLUMN IF NOT EXISTS anonymous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE holders ADD COLUMN IF NOT EXISTS properties JSON DEFAULT '{}';
