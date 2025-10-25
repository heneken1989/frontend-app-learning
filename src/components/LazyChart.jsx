import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load chart components chỉ khi cần thiết
const LazyChart = lazy(() => import('react-chartjs-2'));
const LazyRecharts = lazy(() => import('recharts'));

// Wrapper component để lazy load charts
export const ChartWrapper = ({ children, ...props }) => (
  <Suspense fallback={<LoadingSpinner message="Loading chart..." />}>
    <LazyChart {...props}>
      {children}
    </LazyChart>
  </Suspense>
);

export const RechartsWrapper = ({ children, ...props }) => (
  <Suspense fallback={<LoadingSpinner message="Loading chart..." />}>
    <LazyRecharts {...props}>
      {children}
    </LazyRecharts>
  </Suspense>
);

// Hook để lazy load chart libraries
export const useLazyChart = () => {
  const [chartReady, setChartReady] = React.useState(false);
  
  React.useEffect(() => {
    // Chỉ load khi component mount và user có thể cần chart
    const timer = setTimeout(() => {
      import('chart.js').then(() => {
        setChartReady(true);
      }).catch(err => {
        console.warn('Failed to load chart.js:', err);
      });
    }, 1000); // Delay 1 giây để không ảnh hưởng đến load time ban đầu
    
    return () => clearTimeout(timer);
  }, []);
  
  return chartReady;
};

export default ChartWrapper;
