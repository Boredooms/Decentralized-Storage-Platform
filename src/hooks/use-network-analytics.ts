import { useCallback } from 'react';
import NetworkAnalyticsService from '@/services/NetworkAnalyticsService';

export const useNetworkAnalytics = () => {
  const analyticsService = NetworkAnalyticsService.getInstance();

  const recordTransfer = useCallback((success: boolean, sizeBytes: number, durationMs: number) => {
    analyticsService.recordTransfer(success, sizeBytes, durationMs);
  }, [analyticsService]);

  const getCurrentStats = useCallback(() => {
    return analyticsService.getCurrentStats();
  }, [analyticsService]);

  const getPerformanceHistory = useCallback(() => {
    return analyticsService.getPerformanceHistory();
  }, [analyticsService]);

  return {
    recordTransfer,
    getCurrentStats,
    getPerformanceHistory
  };
};