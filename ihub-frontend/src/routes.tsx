/********************************************************************************
 * Eclipse Tractus-X - Identity Hub Frontend
 *
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
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ParticipantsPage from "./features/participants/ParticipantsPage";
import KeyPairsPage from "./features/keypairs/KeyPairsPage";
import DidPage from "./features/did/DidPage";
import CredentialsPage from "./features/credentials/CredentialsPage";
import CredentialDetailPage from "./features/credentials/CredentialDetailPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/credentials" replace />} />
                    <Route path="participants" element={<ParticipantsPage />} />
                    <Route path="keypairs" element={<KeyPairsPage />} />
                    <Route path="dids" element={<DidPage />} />
                    <Route path="did" element={<Navigate to="/dids" replace />} />
                    <Route path="identity" element={<Navigate to="/credentials" replace />} />
                    <Route path="credentials" element={<CredentialsPage />} />
                    <Route path="credentials/:id" element={<CredentialDetailPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
