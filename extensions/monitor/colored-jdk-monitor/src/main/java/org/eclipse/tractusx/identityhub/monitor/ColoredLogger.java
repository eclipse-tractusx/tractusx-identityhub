package org.eclipse.tractusx.identityhub.monitor;

import org.eclipse.edc.spi.monitor.Monitor;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ColoredLogger implements Monitor {

    // Reset
    private static final String RESET = "\033[0m";

    // Regular Colors
    private static final String BLACK = "\033[0;30m";
    private static final String RED = "\033[0;31m";
    private static final String GREEN = "\033[0;32m";
    private static final String YELLOW = "\033[0;33m";
    private static final String BLUE = "\033[0;34m";

    /**
     * Global logger.
     */
    private static final Logger LOGGER = Logger.getLogger(ColoredLogger.class.getName());

    @Override
    public void severe(final Supplier<String> supplier, final Throwable... errors) {
        log(supplier, Level.SEVERE, errors);
    }

    @Override
    public void severe(final Map<String, Object> data) {
        data.forEach((key, value) -> LOGGER.log(Level.SEVERE, key, value));
    }

    @Override
    public void warning(final Supplier<String> supplier, final Throwable... errors) {
        log(supplier, Level.WARNING, errors);
    }

    @Override
    public void info(final Supplier<String> supplier, final Throwable... errors) {
        log(supplier, Level.INFO, errors);
    }

    @Override
    public void debug(final Supplier<String> supplier, final Throwable... errors) {
        log(supplier, Level.FINE, errors);
    }

    private void log(final Supplier<String> supplier, final Level level, final Throwable... errors) {
        String message = outputColor(level, supplier);
        if (errors == null || errors.length == 0) {
            LOGGER.log(level, () -> message);
        } else {
            Arrays.stream(errors).forEach(error -> LOGGER.log(level, message, error));
        }
    }

    private String outputColor(Level level, Supplier<String> message) {
        StringBuilder builder = new StringBuilder();
        String colorCode = getColorCode(level);
        builder.append(colorCode)
                .append(sanitizeMessage(message))
                .append(RESET);
        return builder.toString();
    }

    private String getColorCode(Level level) {
        return switch (level.toString()) {
            case "SEVERE" -> RED;
            case "WARNING" -> YELLOW;
            case "INFO" -> GREEN;
            case "CONFIG", "FINE" -> BLUE;
            case "FINER", "FINEST" -> BLACK;
            default -> "";
        };
    }
}
