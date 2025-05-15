import { MetricsService } from '../../src/shared/metrics/MetricsService';

describe('MetricsService', () => {
  let metricsService: MetricsService;

  beforeEach(() => {
    metricsService = new MetricsService();
  });

  describe('trackSuccess', () => {
    it('should track successful operation', () => {
      metricsService.trackSuccess('upload');
      metricsService.trackSuccess('upload');
      metricsService.trackSuccess('download');

      const metrics = metricsService.getMetrics();
      
      expect(metrics).toEqual({
        upload: { successes: 2, failures: 0 },
        download: { successes: 1, failures: 0 }
      });
    });

    it('should initialize operation metrics on first success', () => {
      metricsService.trackSuccess('listFiles');
      
      const metrics = metricsService.getMetrics();
      expect(metrics.listFiles).toEqual({ successes: 1, failures: 0 });
    });
  });

  describe('trackFailure', () => {
    it('should track failed operation', () => {
      metricsService.trackFailure('upload');
      metricsService.trackFailure('upload');
      metricsService.trackFailure('delete');

      const metrics = metricsService.getMetrics();
      
      expect(metrics).toEqual({
        upload: { successes: 0, failures: 2 },
        delete: { successes: 0, failures: 1 }
      });
    });

    it('should initialize operation metrics on first failure', () => {
      metricsService.trackFailure('download');
      
      const metrics = metricsService.getMetrics();
      expect(metrics.download).toEqual({ successes: 0, failures: 1 });
    });
  });

  describe('getMetrics', () => {
    it('should return empty object when no metrics tracked', () => {
      expect(metricsService.getMetrics()).toEqual({});
    });

    it('should return combined success and failure metrics', () => {
      metricsService.trackSuccess('upload');
      metricsService.trackSuccess('upload');
      metricsService.trackFailure('upload');
      metricsService.trackSuccess('download');
      metricsService.trackFailure('delete');

      expect(metricsService.getMetrics()).toEqual({
        upload: { successes: 2, failures: 1 },
        download: { successes: 1, failures: 0 },
        delete: { successes: 0, failures: 1 }
      });
    });
  });

  describe('operation isolation', () => {
    it('should track metrics independently per operation', () => {
      metricsService.trackSuccess('upload');
      metricsService.trackFailure('upload');
      metricsService.trackSuccess('download');
      metricsService.trackFailure('delete');

      const metrics = metricsService.getMetrics();
      
      expect(metrics.upload).toEqual({ successes: 1, failures: 1 });
      expect(metrics.download).toEqual({ successes: 1, failures: 0 });
      expect(metrics.delete).toEqual({ successes: 0, failures: 1 });
    });
  });

  describe('edge cases', () => {
    it('should handle consecutive trackSuccess calls', () => {
      for (let i = 0; i < 5; i++) {
        metricsService.trackSuccess('operation');
      }
      
      expect(metricsService.getMetrics().operation).toEqual({
        successes: 5,
        failures: 0
      });
    });

    it('should handle consecutive trackFailure calls', () => {
      for (let i = 0; i < 3; i++) {
        metricsService.trackFailure('operation');
      }
      
      expect(metricsService.getMetrics().operation).toEqual({
        successes: 0,
        failures: 3
      });
    });

    it('should handle mixed operation types', () => {
      metricsService.trackSuccess('mixed');
      metricsService.trackFailure('mixed');
      metricsService.trackSuccess('mixed');
      
      expect(metricsService.getMetrics().mixed).toEqual({
        successes: 2,
        failures: 1
      });
    });
  });
});