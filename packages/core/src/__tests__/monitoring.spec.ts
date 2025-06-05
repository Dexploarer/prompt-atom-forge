/**
 * Performance monitoring tests
 */

import { 
  DefaultMetricRegistry,
  createMetricRegistry,
  MetricType,
  PerformanceSpan,
  MetricRegistry,
  MetricValue
} from '../monitoring';

describe('Performance Monitoring System', () => {
  let registry: DefaultMetricRegistry;
  
  beforeEach(() => {
    registry = createMetricRegistry() as DefaultMetricRegistry;
  });
  
  describe('Counter Metrics', () => {
    it('should register and increment a counter', () => {
      const counter = registry.getOrCreateCounter('test_counter', 'Test counter');
      
      counter.inc();
      expect(counter.value()).toBe(1);
      
      counter.inc(5);
      expect(counter.value()).toBe(6);
    });
    
    it('should register counter with labels', () => {
      const counter = registry.getOrCreateCounter('request_count', 'API request count', ['endpoint', 'status']);
      
      counter.inc({ endpoint: '/api/v1/prompts', status: 'success' });
      counter.inc({ endpoint: '/api/v1/prompts', status: 'success' });
      counter.inc({ endpoint: '/api/v1/prompts', status: 'error' });
      
      expect(counter.value({ endpoint: '/api/v1/prompts', status: 'success' })).toBe(2);
      expect(counter.value({ endpoint: '/api/v1/prompts', status: 'error' })).toBe(1);
    });
  });
  
  describe('Gauge Metrics', () => {
    it('should register and update a gauge', () => {
      const gauge = registry.getOrCreateGauge('memory_usage', 'Memory usage in bytes');
      
      gauge.set(1024);
      expect(gauge.value()).toBe(1024);
      
      gauge.inc(100);
      expect(gauge.value()).toBe(1124);
      
      gauge.dec(24);
      expect(gauge.value()).toBe(1100);
    });
    
    it('should register gauge with labels', () => {
      const gauge = registry.getOrCreateGauge('connection_pool', 'Connection pool size', ['pool']);
      
      gauge.set(5, { pool: 'main' });
      gauge.set(3, { pool: 'worker' });
      
      gauge.inc({ pool: 'main' });
      gauge.dec({ pool: 'worker' });
      
      expect(gauge.value({ pool: 'main' })).toBe(6);
      expect(gauge.value({ pool: 'worker' })).toBe(2);
    });
  });
  
  describe('Histogram Metrics', () => {
    it('should register and observe a histogram', () => {
      const histogram = registry.getOrCreateHistogram('response_time', 'API response time in ms');
      
      histogram.observe(100);
      histogram.observe(150);
      histogram.observe(200);
      
      const stats = histogram.stats();
      
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(450);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
      expect(stats.mean).toBe(150);
    });
    
    it('should calculate percentiles correctly', () => {
      const histogram = registry.getOrCreateHistogram('latency', 'Operation latency');
      
      // Add observations
      for (let i = 1; i <= 100; i++) {
        histogram.observe(i);
      }
      
      const stats = histogram.stats();
      
      expect(stats.percentile50).toBe(50);
      expect(stats.percentile90).toBe(90);
      expect(stats.percentile95).toBe(95);
      expect(stats.percentile99).toBe(99);
    });
    
    it('should register histogram with labels', () => {
      const histogram = registry.getOrCreateHistogram(
        'query_duration', 
        'Database query duration in ms',
        ['db', 'query_type']
      );
      
      histogram.observe(10, { db: 'postgres', query_type: 'select' });
      histogram.observe(20, { db: 'postgres', query_type: 'select' });
      histogram.observe(100, { db: 'postgres', query_type: 'update' });
      
      const selectStats = histogram.stats({ db: 'postgres', query_type: 'select' });
      const updateStats = histogram.stats({ db: 'postgres', query_type: 'update' });
      
      expect(selectStats.count).toBe(2);
      expect(selectStats.mean).toBe(15);
      
      expect(updateStats.count).toBe(1);
      expect(updateStats.mean).toBe(100);
    });
  });
  
  describe('Timer Metrics', () => {
    it('should record duration using timer', async () => {
      const timer = registry.getOrCreateTimer('operation_duration', 'Operation duration in ms');
      
      await new Promise<void>(resolve => {
        const end = timer.start();
        setTimeout(() => {
          end();
          resolve();
        }, 10);
      });
      
      const stats = timer.stats();
      expect(stats.count).toBe(1);
      expect(stats.mean).toBeGreaterThan(0);
    });
    
    it('should time async functions', async () => {
      const asyncFn = async (): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'done';
      };
      
      const result = await registry.timeAsync(
        'async_operation',
        'Async operation timing',
        asyncFn
      );
      
      expect(result).toBe('done');
      
      const timer = registry.getOrCreateTimer('async_operation');
      const stats = timer.stats();
      
      expect(stats.count).toBe(1);
      expect(stats.mean).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Spans', () => {
    it('should create and end performance spans', async () => {
      const span = registry.startSpan('api_call', { endpoint: '/api/prompt' });
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Add a child span
      const childSpan = registry.startSpan('validation', { parent: span.id });
      await new Promise(resolve => setTimeout(resolve, 5));
      childSpan.end();
      
      // End the parent span
      span.end();
      
      // Get the span data
      const spans = registry.getActiveSpans();
      expect(spans.length).toBe(0); // All spans ended
      
      const completedSpans = registry.getCompletedSpans();
      expect(completedSpans.length).toBe(2);
      
      // Check parent span
      const parentSpan = completedSpans.find(s => s.name === 'api_call');
      expect(parentSpan).toBeDefined();
      expect(parentSpan?.attributes.endpoint).toBe('/api/prompt');
      expect(parentSpan?.duration).toBeGreaterThan(0);
      
      // Check child span
      const validationSpan = completedSpans.find(s => s.name === 'validation');
      expect(validationSpan).toBeDefined();
      expect(validationSpan?.parentId).toBe(parentSpan?.id);
    });
  });
  
  describe('Registry Operations', () => {
    it('should reset all metrics', () => {
      const counter = registry.getOrCreateCounter('test_counter', 'Test counter');
      counter.inc(5);
      
      const gauge = registry.getOrCreateGauge('test_gauge', 'Test gauge');
      gauge.set(10);
      
      const histogram = registry.getOrCreateHistogram('test_hist', 'Test histogram');
      histogram.observe(100);
      
      registry.reset();
      
      expect(counter.value()).toBe(0);
      expect(gauge.value()).toBe(0);
      expect(histogram.stats().count).toBe(0);
    });
    
    it('should retrieve all metrics', () => {
      registry.getOrCreateCounter('counter1', 'Counter 1');
      registry.getOrCreateGauge('gauge1', 'Gauge 1');
      registry.getOrCreateHistogram('hist1', 'Histogram 1');
      registry.getOrCreateTimer('timer1', 'Timer 1');
      
      const metrics = registry.getMetrics();
      
      expect(metrics.length).toBe(4);
      expect(metrics.find(m => m.name === 'counter1')).toBeDefined();
      expect(metrics.find(m => m.name === 'gauge1')).toBeDefined();
      expect(metrics.find(m => m.name === 'hist1')).toBeDefined();
      expect(metrics.find(m => m.name === 'timer1')).toBeDefined();
    });
  });
});
