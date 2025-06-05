/**
 * Performance monitoring types
 * @module @prompt-or-die/core/monitoring
 */

/**
 * Performance metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

/**
 * Metric labels for additional dimensions
 */
export type MetricLabels = Record<string, string | number | boolean>;

/**
 * Base metric interface
 */
export interface Metric {
  /** Unique name of the metric */
  name: string;
  /** Metric type */
  type: MetricType;
  /** Optional description */
  description: string | undefined;
  /** Metric labels/tags */
  labels?: MetricLabels;
}

/**
 * Counter metric for tracking incrementing values
 */
export interface CounterMetric extends Metric {
  type: MetricType.COUNTER;
  value: number;
}

/**
 * Gauge metric for tracking values that can go up and down
 */
export interface GaugeMetric extends Metric {
  type: MetricType.GAUGE;
  value: number;
}

/**
 * Histogram metric for tracking distribution of values
 */
export interface HistogramMetric extends Metric {
  type: MetricType.HISTOGRAM;
  values: number[];
  buckets: number[];
  count: number;
  sum: number;
  min: number | undefined;
  max: number | undefined;
  mean: number | undefined;
  median: number | undefined;
  p95: number | undefined;
  p99: number | undefined;
}

/**
 * Timer metric for tracking durations
 */
export interface TimerMetric extends Metric {
  type: MetricType.TIMER;
  durationMs: number;
  startTime: number | undefined;
  endTime: number | undefined;
}

/**
 * Performance measurement result
 */
export interface PerformanceMeasurement {
  /** Name of the measurement */
  name: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Additional labels */
  labels?: MetricLabels;
}

/**
 * Performance span for measuring code blocks
 */
export interface PerformanceSpan {
  /** Start the span */
  start(): void;
  /** End the span and record the measurement */
  end(): PerformanceMeasurement;
  /** Add a label to the span */
  addLabel(key: string, value: string | number | boolean): PerformanceSpan;
}

/**
 * Metric registry options
 */
export interface MetricRegistryOptions {
  /** Default labels to apply to all metrics */
  defaultLabels?: MetricLabels;
  /** Enable collection of default SDK metrics */
  enableDefaultMetrics?: boolean;
  /** Maximum number of values to store in histograms */
  maxHistogramValues?: number;
  /** Enable/disable metrics collection globally */
  enabled?: boolean;
}

/**
 * Metric registry for storing and retrieving metrics
 */
export interface MetricRegistry {
  /** Register a counter metric */
  registerCounter(name: string, description?: string, labels?: MetricLabels): CounterMetric;
  /** Register a gauge metric */
  registerGauge(name: string, description?: string, labels?: MetricLabels): GaugeMetric;
  /** Register a histogram metric */
  registerHistogram(
    name: string, 
    buckets?: number[], 
    description?: string, 
    labels?: MetricLabels
  ): HistogramMetric;
  /** Register a timer metric */
  registerTimer(name: string, description?: string, labels?: MetricLabels): TimerMetric;
  /** Get a metric by name */
  getMetric<T extends Metric>(name: string): T | undefined;
  /** Get all metrics */
  getAllMetrics(): Metric[];
  /** Remove a metric */
  removeMetric(name: string): boolean;
  /** Clear all metrics */
  clear(): void;
  /** Create a performance span */
  createSpan(name: string, labels?: MetricLabels): PerformanceSpan;
  /** Time a function execution */
  time<T>(name: string, fn: () => T, labels?: MetricLabels): T;
  /** Time an async function execution */
  timeAsync<T>(name: string, fn: () => Promise<T>, labels?: MetricLabels): Promise<T>;
  
  /** Get or create a counter metric with additional convenience methods */
  counter(name: string, description?: string, labels?: MetricLabels): {
    inc(value?: number): void;
    dec(value?: number): void;
    reset(): void;
    get(): number;
    set(value: number): void;
  };
  
  /** Start a new performance measurement span */
  startSpan(name: string, labels?: MetricLabels): PerformanceSpan;
  
  /** Start a timer for timing code execution */
  startTimer(name: string, labels?: MetricLabels): {
    end(): number;
  };
  
  /** Check if metrics collection is enabled */
  isEnabled(): boolean;
}
