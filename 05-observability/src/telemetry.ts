import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

class TelemetryManager {
  private sdk: NodeSDK | null = null;

  initialize(): void {
    const telemetryEnabled = process.env.CLAUDE_CODE_ENABLE_TELEMETRY === '1';

    console.log(`\n${'='.repeat(70)}`);
    console.log('OpenTelemetry Configuration - CORRECTED');
    console.log(`${'='.repeat(70)}`);
    console.log(`CLAUDE_CODE_ENABLE_TELEMETRY: ${telemetryEnabled ? '✓ ENABLED' : '✗ DISABLED'}`);
    console.log(`Expected behavior: ${telemetryEnabled ? 'Metrics and logs should appear' : 'No metrics/logs expected'}`);
    console.log(`Looking for: ConsoleMetricExporter + ConsoleLogRecordExporter output`);
    console.log(`${'='.repeat(70)}\n`);

    // Set environment variables for console exporters
    process.env.OTEL_METRICS_EXPORTER = 'console';
    process.env.OTEL_LOGS_EXPORTER = 'console';

    const resource = Resource.default().merge(
      new Resource({
        [ATTR_SERVICE_NAME]: 'claude-observability-test',
        [ATTR_SERVICE_VERSION]: '1.0.0',
      })
    );

    this.sdk = new NodeSDK({
      resource,
      // Configure metrics reader with console exporter
      metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
        exportIntervalMillis: 5000, // Export every 5 seconds
      }),
      // Configure logs processor with console exporter
      logRecordProcessors: [
        new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
      ],
    });

    this.sdk.start();
    console.log('✓ OpenTelemetry SDK initialized (metrics + logs exporters)\n');
    console.log('Note: Metrics will export every 5 seconds\n');
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      console.log('\n\nShutting down OpenTelemetry SDK...');
      await this.sdk.shutdown();
      console.log('✓ OpenTelemetry SDK shutdown complete');
    }
  }
}

export const telemetry = new TelemetryManager();
