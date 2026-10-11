/*
 *   Copyright (c) 2026 LKS Next
 *   Copyright (c) 2026 Contributors to the Eclipse Foundation
 *
 *   See the NOTICE file(s) distributed with this work for additional
 *   information regarding copyright ownership.
 *
 *   This program and the accompanying materials are made available under the
 *   terms of the Apache License, Version 2.0 which is available at
 *   https://www.apache.org/licenses/LICENSE-2.0.
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *   WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *   License for the specific language governing permissions and limitations
 *   under the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 *
 */

package org.eclipse.tractusx.monitor;

import org.eclipse.edc.spi.monitor.Monitor;

import java.util.Map;
import java.util.function.Supplier;
import java.util.logging.Logger;

/**
 * Forwards EDC {@link Monitor} calls to {@code java.util.logging}, so the configured
 * handlers/formatter/levels in logging.properties actually apply (ports the deprecated
 * upstream monitor-jdk-logger extension, removed after EDC 0.16.0).
 * The Monitor interface has no call-site class, so a single shared logger is used.
 */
public class JdkLoggerMonitor implements Monitor {

    private static final Logger LOGGER = Logger.getLogger("org.eclipse.edc");

    @Override
    public void severe(Supplier<String> supplier, Throwable... errors) {
        log(java.util.logging.Level.SEVERE, supplier, errors);
    }

    @Override
    public void severe(Map<String, Object> data) {
        data.forEach((key, value) -> LOGGER.log(java.util.logging.Level.SEVERE, key, value));
    }

    @Override
    public void warning(Supplier<String> supplier, Throwable... errors) {
        log(java.util.logging.Level.WARNING, supplier, errors);
    }

    @Override
    public void info(Supplier<String> supplier, Throwable... errors) {
        log(java.util.logging.Level.INFO, supplier, errors);
    }

    @Override
    public void debug(Supplier<String> supplier, Throwable... errors) {
        log(java.util.logging.Level.FINE, supplier, errors);
    }

    private void log(java.util.logging.Level level, Supplier<String> supplier, Throwable... errors) {
        if (errors == null || errors.length == 0) {
            LOGGER.log(level, () -> sanitizeMessage(supplier));
        } else {
            for (Throwable error : errors) {
                LOGGER.log(level, sanitizeMessage(supplier), error);
            }
        }
    }
}
