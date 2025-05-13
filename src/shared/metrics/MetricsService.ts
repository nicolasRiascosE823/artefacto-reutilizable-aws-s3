export class MetricsService {
  private operations = new Map<string, { successes: number; failures: number }>();

  trackSuccess(operation: string): void {
    const metrics = this.operations.get(operation) || { successes: 0, failures: 0 };
    this.operations.set(operation, { ...metrics, successes: metrics.successes + 1 });
  }

  trackFailure(operation: string): void {
    const metrics = this.operations.get(operation) || { successes: 0, failures: 0 };
    this.operations.set(operation, { ...metrics, failures: metrics.failures + 1 });
  }

  getMetrics(): Record<string, { successes: number; failures: number }> {
    return Object.fromEntries(this.operations.entries());
  }
}