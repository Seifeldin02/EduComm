import { useEffect } from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

function logMetric(metric: PerformanceMetric) {
  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`Performance metric - ${metric.name}: ${metric.value}ms`);
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === "production") {
    // Send to your analytics service
    // Example: analytics.track('performance_metric', metric);
  }
}

export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor page load performance
    const measurePageLoad = () => {
      if ("performance" in window && "getEntriesByType" in performance) {
        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          // Time to First Byte
          const ttfb = navigation.responseStart - navigation.requestStart;
          logMetric({ name: "TTFB", value: ttfb, timestamp: Date.now() });

          // DOM Content Loaded
          const domContentLoaded =
            navigation.domContentLoadedEventEnd - navigation.fetchStart;
          logMetric({
            name: "DOMContentLoaded",
            value: domContentLoaded,
            timestamp: Date.now(),
          });

          // Page Load Complete
          const loadComplete = navigation.loadEventEnd - navigation.fetchStart;
          logMetric({
            name: "LoadComplete",
            value: loadComplete,
            timestamp: Date.now(),
          });
        }
      }
    };

    // Monitor resource loading
    const measureResources = () => {
      if ("performance" in window && "getEntriesByType" in performance) {
        const resources = performance.getEntriesByType(
          "resource"
        ) as PerformanceResourceTiming[];

        resources.forEach((resource) => {
          if (resource.duration > 1000) {
            // Log slow resources (>1s)
            console.warn(
              `Slow resource: ${resource.name} took ${resource.duration}ms`
            );
          }
        });
      }
    };

    // Run measurements after page load
    if (document.readyState === "complete") {
      measurePageLoad();
      measureResources();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => {
          measurePageLoad();
          measureResources();
        }, 0);
      });
    }

    // Monitor long tasks if supported
    if ("PerformanceObserver" in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`);
              logMetric({
                name: "LongTask",
                value: entry.duration,
                timestamp: Date.now(),
              });
            }
          }
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });

        return () => {
          longTaskObserver.disconnect();
        };
      } catch (e) {
        console.warn("Long task observer not supported");
      }
    }
  }, []);
}

// Custom hook for measuring component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // Log renders that take longer than one frame (16ms)
        logMetric({
          name: `Render_${componentName}`,
          value: renderTime,
          timestamp: Date.now(),
        });
      }
    };
  });
}
