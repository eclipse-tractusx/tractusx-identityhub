/*
 *   Copyright (c) 2025 LKS NEXT
 *   Copyright (c) 2025 Contributors to the Eclipse Foundation
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

package org.eclipse.tractusx.identityhub.monitor;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.logging.Formatter;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.LogRecord;

public class ColorfulFormatter extends Formatter {

    private static final String DEFAULT_FORMAT = "%1$tF %1$tT %7$s%4$s%8$s %2$s %5$s%6$s%n";

    // Reset
    private static final String RESET = "\033[0m";

    // Regular Colors
    private static final String BLACK = "\033[0;30m";
    private static final String RED = "\033[0;31m";
    private static final String GREEN = "\033[0;32m";
    private static final String YELLOW = "\033[0;33m";
    private static final String BLUE = "\033[0;34m";

    private final String format;

    public ColorfulFormatter() {
        LogManager manager = LogManager.getLogManager();
        String cname = getClass().getName();

        // Default to the same format as SimpleFormatter if not set
        format = getProperty(manager,
            cname + ".format"
        );
    }

    private String getProperty(LogManager manager, String name) {
        String val = manager.getProperty(name);
        return (val != null) ? val : DEFAULT_FORMAT;
    }


    private String getColorCode(Level level) {
        return switch (level.toString()) {
            case "SEVERE" -> RED;
            case "WARNING" -> YELLOW;
            case "CONFIG", "FINE" -> BLUE;
            case "FINER", "FINEST" -> BLACK;
            default -> GREEN; //INFO or uncaptured
        };
    }

    @Override
    public String format(LogRecord record) {
        ZonedDateTime zdt = ZonedDateTime.ofInstant(
                record.getInstant(), ZoneId.systemDefault());

        String source;
        if (record.getSourceClassName() != null) {
            source = record.getSourceClassName();
            if (record.getSourceMethodName() != null) {
                source += " " + record.getSourceMethodName();
            }
        } else {
            source = record.getLoggerName();
        }

        String message = formatMessage(record);

        String throwable = "";
        if (record.getThrown() != null) {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            pw.println();
            record.getThrown().printStackTrace(pw);
            pw.close();
            throwable = sw.toString();
        }

        // Pick color by level
        String color = getColorCode(record.getLevel());

        return String.format(format,
            zdt,                            // %1
            source,                         // %2
            record.getLoggerName(),         // %3
            record.getLevel().getLocalizedName(), // %4
            message,                        // %5
            throwable,                      // %6
            color,                          // %7
            RESET                           // %8
        );
    }
}
