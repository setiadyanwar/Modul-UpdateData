import { ref, computed, readonly } from 'vue';
import { useLogger } from './useLogger';

const { debug, info } = useLogger();

// Loading state configuration
const LOADING_CONFIG = {
  minDisplayTime: 300, // Minimum time to show loading (ms)
  maxDisplayTime: 30000, // Maximum time to show loading (ms)
  autoHideDelay: 1000, // Auto hide delay after completion (ms)
  showProgress: true,
  enableSkeleton: true
};

// Global loading state
const globalLoadingState = ref({
  isLoading: false,
  progress: 0,
  message: '',
  type: 'spinner', // spinner, skeleton, progress
  startTime: null,
  autoHideTimer: null,
  loadingQueue: []
});

// Component-specific loading states
const componentLoadingStates = ref(new Map());

export const useLoadingState = () => {
  const startLoading = (options = {}) => {
    const {
      message = 'Loading...',
      type = 'spinner',
      progress = 0,
      componentId = null,
      autoHide = true
    } = options;

    const loadingId = componentId || `loading_${Date.now()}_${Math.random()}`;

    const loadingState = {
      id: loadingId,
      isLoading: true,
      progress,
      message,
      type,
      startTime: Date.now(),
      autoHide,
      componentId
    };

    // Set global loading state
    globalLoadingState.value = {
      ...globalLoadingState.value,
      isLoading: true,
      progress,
      message,
      type,
      startTime: Date.now()
    };

    // Set component-specific loading state
    if (componentId) {
      componentLoadingStates.value.set(componentId, loadingState);
    }

    // Add to loading queue
    globalLoadingState.value.loadingQueue.push(loadingId);

    debug(`Loading started: ${loadingId}`, { type, componentId });
    
    return loadingId;
  };

  const updateLoading = (loadingId, updates = {}) => {
    const { progress, message, type } = updates;

    // Update global state
    if (progress !== undefined) {
      globalLoadingState.value.progress = progress;
    }
    if (message !== undefined) {
      globalLoadingState.value.message = message;
    }
    if (type !== undefined) {
      globalLoadingState.value.type = type;
    }

    // Update component state
    const componentState = componentLoadingStates.value.get(loadingId);
    if (componentState) {
      Object.assign(componentState, updates);
    }

    debug(`Loading updated: ${loadingId}`, updates);
  };

  const stopLoading = (loadingId, options = {}) => {
    const { success = true, message = '', autoHide = true } = options;

    // Remove from loading queue
    const queueIndex = globalLoadingState.value.loadingQueue.indexOf(loadingId);
    if (queueIndex > -1) {
      globalLoadingState.value.loadingQueue.splice(queueIndex, 1);
    }

    // Check if this was the last loading item
    if (globalLoadingState.value.loadingQueue.length === 0) {
      const elapsedTime = Date.now() - globalLoadingState.value.startTime;
      const minDisplayTime = LOADING_CONFIG.minDisplayTime;

      if (elapsedTime < minDisplayTime) {
        // Wait for minimum display time
        setTimeout(() => {
          hideLoading(loadingId);
        }, minDisplayTime - elapsedTime);
      } else {
        hideLoading(loadingId);
      }
    }

    // Update component state
    const componentState = componentLoadingStates.value.get(loadingId);
    if (componentState) {
      componentState.isLoading = false;
      componentState.message = message;
      componentState.success = success;
    }

    debug(`Loading stopped: ${loadingId}`, { success });
  };

  const hideLoading = (loadingId) => {
    // Clear global state if no more loading items
    if (globalLoadingState.value.loadingQueue.length === 0) {
      globalLoadingState.value.isLoading = false;
      globalLoadingState.value.progress = 0;
      globalLoadingState.value.message = '';
      globalLoadingState.value.startTime = null;
    }

    // Remove component state
    componentLoadingStates.value.delete(loadingId);

    debug(`Loading hidden: ${loadingId}`);
  };

  const getLoadingState = (componentId = null) => {
    if (componentId) {
      return componentLoadingStates.value.get(componentId) || null;
    }
    return globalLoadingState.value;
  };

  const isComponentLoading = (componentId) => {
    return componentLoadingStates.value.has(componentId);
  };

  const getLoadingProgress = () => {
    return globalLoadingState.value.progress;
  };

  const setLoadingProgress = (progress) => {
    globalLoadingState.value.progress = Math.max(0, Math.min(100, progress));
  };

  const incrementProgress = (amount = 10) => {
    const currentProgress = globalLoadingState.value.progress;
    globalLoadingState.value.progress = Math.min(100, currentProgress + amount);
  };

  const createSkeletonLoader = (componentId, skeletonConfig = {}) => {
    const {
      rows = 3,
      animated = true,
      height = '20px',
      width = '100%',
      spacing = '8px'
    } = skeletonConfig;

    const skeletonState = {
      id: componentId,
      type: 'skeleton',
      rows,
      animated,
      height,
      width,
      spacing,
      isLoading: true
    };

    componentLoadingStates.value.set(componentId, skeletonState);
    
    debug(`Skeleton loader created: ${componentId}`, skeletonConfig);
    
    return componentId;
  };

  const withLoading = (operation, options = {}) => {
    return async (...args) => {
      const loadingId = startLoading(options);
      
      try {
        const result = await operation(...args);
        stopLoading(loadingId, { success: true });
        return result;
      } catch (error) {
        stopLoading(loadingId, { 
          success: false, 
          message: error.message || 'Operation failed' 
        });
        throw error;
      }
    };
  };

  const withProgress = (operation, progressCallback) => {
    return async (...args) => {
      const loadingId = startLoading({ type: 'progress', progress: 0 });
      
      try {
        const result = await operation(...args, (progress) => {
          setLoadingProgress(progress);
          progressCallback?.(progress);
        });
        
        setLoadingProgress(100);
        stopLoading(loadingId, { success: true });
        return result;
      } catch (error) {
        stopLoading(loadingId, { 
          success: false, 
          message: error.message || 'Operation failed' 
        });
        throw error;
      }
    };
  };

  const clearAllLoading = () => {
    globalLoadingState.value.loadingQueue = [];
    globalLoadingState.value.isLoading = false;
    globalLoadingState.value.progress = 0;
    globalLoadingState.value.message = '';
    globalLoadingState.value.startTime = null;
    
    componentLoadingStates.value.clear();
    
    info('All loading states cleared');
  };

  const getLoadingStats = () => {
    return {
      globalLoading: globalLoadingState.value.isLoading,
      activeComponents: componentLoadingStates.value.size,
      queueLength: globalLoadingState.value.loadingQueue.length,
      progress: globalLoadingState.value.progress,
      message: globalLoadingState.value.message
    };
  };

  return {
    startLoading,
    updateLoading,
    stopLoading,
    hideLoading,
    getLoadingState,
    isComponentLoading,
    getLoadingProgress,
    setLoadingProgress,
    incrementProgress,
    createSkeletonLoader,
    withLoading,
    withProgress,
    clearAllLoading,
    getLoadingStats,
    globalLoadingState: readonly(globalLoadingState),
    componentLoadingStates: readonly(componentLoadingStates)
  };
};
