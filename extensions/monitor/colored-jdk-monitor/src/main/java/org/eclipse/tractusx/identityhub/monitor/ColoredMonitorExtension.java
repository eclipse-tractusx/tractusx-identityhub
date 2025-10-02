package org.eclipse.tractusx.identityhub.monitor;

import org.eclipse.edc.runtime.metamodel.annotation.Extension;
import org.eclipse.edc.spi.monitor.Monitor;
import org.eclipse.edc.spi.system.MonitorExtension;

@Extension("Colored Logger Monitor")
public class ColoredMonitorExtension implements MonitorExtension {

    @Override
    public Monitor getMonitor() {
        return new ColoredLogger();
    }
}
