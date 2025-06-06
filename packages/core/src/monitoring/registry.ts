/**
 * Performance metric registry implementation
 * @module @prompt-or-die/core/monitoring
 */

import {
  Metric,
  MetricType,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  TimerMetric,
  MetricLabels,
  MetricRegistry,
  MetricRegistryOptions,
  PerformanceSpan,
  PerformanceMeasurement
} from './types';

/**
 * Implementation of a performance span
 */
class PerformanceSpanImpl implements PerformanceSpan {
  private name: string;
  private labels: MetricLabels;
  private startTime: number = 0;
  private ended: boolean = false;
  
  constructor(name: string, labels: MetricLabels = {}) {
    this.name = name;
    this.labels = { ...labels };
  }
  
  /**
   * Start the performance span
   */
  start(): void {
    if (this.startTime !== 0) {
      return;
    }
    this.startTime = performance.now();
  }
  
  /**
   * End the performance span and record the measurement
   */
  end(): PerformanceMeasurement {
    if (this.ended) {
      throw new Error(`Performance span ${this.name} already ended`);
    }
    
    if (this.startTime === 0) {
      throw new Error(`Performance span ${this.name} never started`);
    }
    
    const endTime = performance.now();
    const durationMs = endTime - this.startTime;
    this.ended = true;
    
    return {
      name: this.name,
      durationMs,
      startTime: this.startTime,
      endTime,
      labels: { ...this.labels }
    };
  }
  
  /**
   * Add a label to the span
   */
  addLabel(key: string, value: string | number | boolean): PerformanceSpan {
    this.labels[key] = value;
    return this;
  }
}

/**
 * Default implementation of the metric registry
 */
export class DefaultMetricRegistry implements MetricRegistry {
  private metrics: Map<string, Metric> = new Map();
  private defaultLabels: MetricLabels;
  private maxHistogramValues: number;
  private enabled: boolean;
  
  constructor(options: MetricRegistryOptions = {}) {
    this.defaultLabels = options.defaultLabels || {};
    this.maxHistogramValues = options.maxHistogramValues || 1000;
    this.enabled = options.enabled !== false;
    
    if (options.enableDefaultMetrics) {
      this.initializeDefaultMetrics();
    }
  }
  
  /**
   * Initialize default SDK metrics
   */
  private initializeDefaultMetrics(): void {
    // SDK version
    this.registerGauge('promptordie_sdk_info', 'SDK version and info', {
      ...this.defaultLabels,
      version: process.env['npm_package_version'] || 'unknown'
    });
    
    // Prompt execution count
    this.registerCounter('promptordie_prompt_executions_total', 'Total number of prompt executions');
    
    // Prompt execution duration
    this.registerHistogram(
      'promptordie_prompt_execution_duration_ms',
      [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      'Prompt execution duration in milliseconds'
    );
    
    // Prompt size metrics
    this.registerHistogram(
      'promptordie_prompt_size_blocks',
      [1, 2, 5, 10, 25, 50, 100],
      'Number of blocks in a prompt'
    );
    
    // Prompt token count
    this.registerHistogram(
      'promptordie_prompt_token_count',
      [100, 500, 1000, 2500, 5000, 10000, 20000],
      'Estimated token count in a prompt'
    );
    
    // Error count
    this.registerCounter('promptordie_errors_total', 'Total number of errors');
  }
  
  /**
   * Register a counter metric
   */
  registerCounter(
    name: string, 
    description?: string, 
    labels?: MetricLabels
  ): CounterMetric {
    const metric: CounterMetric = {
      name,
      type: MetricType.COUNTER,
      description: description || undefined,
      labels: { ...this.defaultLabels, ...(labels || {}) },
      value: 0
    };
    
    this.metrics.set(name, metric);
    return metric;
  }
  
  /**
   * Register a gauge metric
   */
  registerGauge(
    name: string, 
    description?: string, 
    labels?: MetricLabels
  ): GaugeMetric {
    const metric: GaugeMetric = {
      name,
      type: MetricType.GAUGE,
      description: description || undefined,
      labels: { ...this.defaultLabels, ...(labels || {}) },
      value: 0
    };
    
    this.metrics.set(name, metric);
    return metric;
  }
  
  /**
   * Register a histogram metric
   */
  registerHistogram(
    name: string, 
    buckets?: number[], 
    description?: string, 
    labels?: MetricLabels
  ): HistogramMetric {
    const metric: HistogramMetric = {
      name,
      type: MetricType.HISTOGRAM,
      description: description || undefined,
      labels: { ...this.defaultLabels, ...(labels || {}) },
      values: [],
      buckets: buckets || [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
      count: 0,
      sum: 0,
      min: undefined,
      max: undefined,
      mean: undefined,
      median: undefined,
      p95: undefined,
      p99: undefined
    };
    
    this.metrics.set(name, metric);
    return metric;
  }
  
  /**
   * Register a timer metric
   */
  registerTimer(
    name: string, 
    description?: string, 
    labels?: MetricLabels
  ): TimerMetric {
    const metric: TimerMetric = {
      name,
      type: MetricType.TIMER,
      description: description || undefined,
      labels: { ...this.defaultLabels, ...(labels || {}) },
      durationMs: 0,
      startTime: undefined,
      endTime: undefined
    };
    
    this.metrics.set(name, metric);
    return metric;
  }
  
  /**
   * Get a metric by name
   */
  getMetric<T extends Metric>(name: string): T | undefined {
    return this.metrics.get(name) as T | undefined;
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Remove a metric
   */
  removeMetric(name: string): boolean {
    return this.metrics.delete(name);
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
  
  /**
   * Create a performance span
   */
  createSpan(name: string, labels?: MetricLabels): PerformanceSpan {
    const span = new PerformanceSpanImpl(name, { ...this.defaultLabels, ...(labels || {}) });
    span.start();
    return span;
  }
  
  /**
   * Time a function execution
   */
  time<T>(name: string, fn: () => T, labels?: MetricLabels): T {
    const span = this.createSpan(name, labels);
    try {
      const result = fn();
      this.recordTimerMetric(span.end());
      return result;
    } catch (error) {
      this.recordTimerMetric(span.end());
      throw error;
    }
  }
  
  /**
   * Time an async function execution
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T> {
    const span = this.createSpan(name, labels);
    try {
      const result = await fn();
      this.recordTimerMetric(span.end());
      return result;
    } catch (error) {
      this.recordTimerMetric(span.end());
      throw error;
    }
  }
  
  /**
   * Update histogram statistics
   */
  private updateHistogramStats(metric: HistogramMetric): void {
    if (metric.values.length === 0) {
      metric.min = undefined;
      metric.max = undefined;
      metric.mean = undefined;
      metric.median = undefined;
      metric.p95 = undefined;
      metric.p99 = undefined;
      metric.sum = 0;
      metric.count = 0;
      return;
    }
    
    // Sort values for percentile calculations
    const sortedValues = [...metric.values].sort((a, b) => a - b);
    
    // Calculate min/max
    metric.min = sortedValues[0];
    metric.max = sortedValues[sortedValues.length - 1];
    
    // Calculate sum and mean
    metric.sum = sortedValues.reduce((sum, val) => sum + val, 0);
    metric.count = sortedValues.length;
    metric.mean = metric.sum / metric.count;
    
    // Calculate median (if we have values)
    if (sortedValues.length > 0) {
      const midIndex = Math.floor(sortedValues.length / 2);
      metric.median = sortedValues.length % 2 === 0
        ? (sortedValues[midIndex - 1]! + sortedValues[midIndex]!) / 2
        : sortedValues[midIndex]!;
      
      // Calculate percentiles (if we have enough values)
      if (sortedValues.length > 20) { // Only calculate percentiles with enough data points
        const p95Index = Math.ceil(sortedValues.length * 0.95) - 1;
        const p99Index = Math.ceil(sortedValues.length * 0.99) - 1;
        
        metric.p95 = p95Index >= 0 && p95Index < sortedValues.length ? sortedValues[p95Index] : undefined;
        metric.p99 = p99Index >= 0 && p99Index < sortedValues.length ? sortedValues[p99Index] : undefined;
      }
    }
  }
  
  /**
   * Record a timer measurement
   */
  private recordTimerMetric(measurement: PerformanceMeasurement): void {
    // Update or create timer metric
    let timer = this.getMetric<TimerMetric>(measurement.name);
    if (!timer) {
      timer = this.registerTimer(
        measurement.name,
        `Timer for ${measurement.name}`,
        measurement.labels
      );
    }
    timer.durationMs = measurement.durationMs;
    timer.startTime = measurement.startTime;
    timer.endTime = measurement.endTime;
    
    // Also record in histogram for statistical analysis
    const histogramName = `${measurement.name}_histogram`;
    let histogram = this.getMetric<HistogramMetric>(histogramName);
    if (!histogram) {
      histogram = this.registerHistogram(
        histogramName,
        undefined,
        `Histogram for ${measurement.name}`,
        measurement.labels
      );
    }
    
    // Maintain maximum size of values array
    if (histogram.values.length >= this.maxHistogramValues) {
      histogram.values.shift();
    }
    
    histogram.values.push(measurement.durationMs);
    this.updateHistogramStats(histogram);
  }
  
  /**
   * Get or create a counter metric with additional convenience methods
   */
  counter(name: string, description?: string, labels?: MetricLabels) {
    if (!this.enabled) {
      // Return no-op counter when metrics are disabled
      return {
        inc: () => {},
        dec: () => {},
        reset: () => {},
        get: () => 0,
        set: () => {}
      };
    }
    
    // Get or create counter
    let counter = this.getMetric<CounterMetric>(name);
    if (!counter) {
      counter = this.registerCounter(name, description, labels);
    }
    
    // Return counter with convenience methods
    return {
      inc: (value = 1) => {
        counter.value += value;
      },
      dec: (value = 1) => {
        counter.value = Math.max(0, counter.value - value);
      },
      reset: () => {
        counter.value = 0;
      },
      get: () => counter.value,
      set: (value: number) => {
        counter.value = value;
      }
    };
  }
  
  /**
   * Start a new performance measurement span
   */
  startSpan(name: string, labels?: MetricLabels): PerformanceSpan {
    return this.createSpan(name, labels);
  }
  
  /**
   * Start a timer for timing code execution
   */
  startTimer(name: string, labels?: MetricLabels) {
    if (!this.enabled) {
      // Return no-op timer when metrics are disabled
      return {
        end: () => 0
      };
    }
    
    const start = performance.now();
    return {
      end: () => {
        const end = performance.now();
        const duration = end - start;
        
        this.recordTimerMetric({
          name,
          durationMs: duration,
          startTime: start,
          endTime: end,
          labels: { ...this.defaultLabels, ...(labels || {}) }
        });
        
        return duration;
      }
    };
  }
  
  /**
   * Check if metrics collection is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
