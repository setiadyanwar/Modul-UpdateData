import { ref, readonly } from 'vue';
import { useLogger } from './useLogger';

const { debug, warn, error } = useLogger();

// Storage configuration
const STORAGE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  compressionThreshold: 1024, // Compress data larger than 1KB
  batchSize: 10, // Number of operations to batch
  retryAttempts: 3
};

// Storage state
const storageState = ref({
  isAvailable: false,
  totalSize: 0,
  operationQueue: [],
  isProcessing: false
});

// Simple compression (base64 for demo, can be enhanced with proper compression)
const compress = (data) => {
  if (typeof data === 'string' && data.length > STORAGE_CONFIG.compressionThreshold) {
    return `compressed:${btoa(data)}`;
  }
  return data;
};

const decompress = (data) => {
  if (typeof data === 'string' && data.startsWith('compressed:')) {
    return atob(data.replace('compressed:', ''));
  }
  return data;
};

export const useStorage = () => {
  const checkAvailability = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      storageState.value.isAvailable = true;
      return true;
    } catch (e) {
      storageState.value.isAvailable = false;
      warn('localStorage is not available', e);
      return false;
    }
  };

  const getSize = (data) => {
    return new Blob([JSON.stringify(data)]).size;
  };

  const processQueue = async () => {
    if (storageState.value.isProcessing || storageState.value.operationQueue.length === 0) {
      return;
    }

    storageState.value.isProcessing = true;
    const batch = storageState.value.operationQueue.splice(0, STORAGE_CONFIG.batchSize);

    try {
      await Promise.all(
        batch.map(async (operation) => {
          try {
            switch (operation.type) {
              case 'set':
                await setItem(operation.key, operation.value, operation.options);
                break;
              case 'get':
                operation.resolve(await getItem(operation.key));
                break;
              case 'remove':
                await removeItem(operation.key);
                break;
              case 'clear':
                await clear();
                break;
            }
          } catch (err) {
            operation.reject?.(err);
            error(`Storage operation failed: ${operation.type}`, err);
          }
        })
      );
    } finally {
      storageState.value.isProcessing = false;
      
      // Process remaining items in queue
      if (storageState.value.operationQueue.length > 0) {
        setTimeout(processQueue, 0);
      }
    }
  };

  const queueOperation = (operation) => {
    return new Promise((resolve, reject) => {
      storageState.value.operationQueue.push({
        ...operation,
        resolve,
        reject
      });
      
      if (!storageState.value.isProcessing) {
        processQueue();
      }
    });
  };

  const setItem = async (key, value, options = {}) => {
    if (!checkAvailability()) {
      throw new Error('localStorage is not available');
    }

    const dataToStore = {
      value: options.compress ? compress(value) : value,
      timestamp: Date.now(),
      version: options.version || '1.0',
      metadata: options.metadata || {}
    };

    const size = getSize(dataToStore);
    
    // Check if we have enough space
    if (storageState.value.totalSize + size > STORAGE_CONFIG.maxSize) {
      await cleanup();
    }

    try {
      localStorage.setItem(key, JSON.stringify(dataToStore));
      storageState.value.totalSize += size;
      debug(`Storage set: ${key}`, { size: `${(size / 1024).toFixed(2)}KB`, compressed: !!options.compress });
    } catch (err) {
      error(`Failed to set storage item: ${key}`, err);
      throw err;
    }
  };

  const getItem = async (key, options = {}) => {
    if (!checkAvailability()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if data is expired
      if (options.maxAge && Date.now() - data.timestamp > options.maxAge) {
        await removeItem(key);
        return null;
      }

      const value = options.decompress ? decompress(data.value) : data.value;
      debug(`Storage get: ${key}`);
      
      return value;
    } catch (err) {
      error(`Failed to get storage item: ${key}`, err);
      return null;
    }
  };

  const removeItem = async (key) => {
    if (!checkAvailability()) {
      return;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const size = getSize(JSON.parse(stored));
        localStorage.removeItem(key);
        storageState.value.totalSize = Math.max(0, storageState.value.totalSize - size);
        debug(`Storage removed: ${key}`);
      }
    } catch (err) {
      error(`Failed to remove storage item: ${key}`, err);
    }
  };

  const clear = async () => {
    if (!checkAvailability()) {
      return;
    }

    try {
      localStorage.clear();
      storageState.value.totalSize = 0;
      debug('Storage cleared');
    } catch (err) {
      error('Failed to clear storage', err);
    }
  };

  const cleanup = async () => {
    if (!checkAvailability()) {
      return;
    }

    try {
      const keys = Object.keys(localStorage);
      const items = keys.map(key => ({
        key,
        data: JSON.parse(localStorage.getItem(key)),
        size: getSize(localStorage.getItem(key))
      }));

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.data.timestamp - b.data.timestamp);

      // Remove oldest items until we have enough space
      let removedSize = 0;
      const targetSize = STORAGE_CONFIG.maxSize * 0.8; // Keep 80% of max size

      for (const item of items) {
        if (storageState.value.totalSize - removedSize <= targetSize) {
          break;
        }
        
        await removeItem(item.key);
        removedSize += item.size;
      }

      debug(`Storage cleanup completed, freed ${removedSize} bytes`);
    } catch (err) {
      error('Failed to cleanup storage', err);
    }
  };

  const getStats = () => {
    if (!checkAvailability()) {
      return { available: false };
    }

    const keys = Object.keys(localStorage);
    const totalSize = keys.reduce((size, key) => {
      try {
        return size + getSize(localStorage.getItem(key));
      } catch {
        return size;
      }
    }, 0);

    return {
      available: true,
      totalKeys: keys.length,
      totalSize,
      maxSize: STORAGE_CONFIG.maxSize,
      usagePercentage: (totalSize / STORAGE_CONFIG.maxSize) * 100
    };
  };

  const batchSet = async (items, options = {}) => {
    const promises = items.map(([key, value]) => 
      setItem(key, value, options)
    );
    
    return Promise.allSettled(promises);
  };

  const batchGet = async (keys, options = {}) => {
    const promises = keys.map(key => getItem(key, options));
    const results = await Promise.allSettled(promises);
    
    return keys.reduce((acc, key, index) => {
      acc[key] = results[index].status === 'fulfilled' ? results[index].value : null;
      return acc;
    }, {});
  };

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    cleanup,
    getStats,
    batchSet,
    batchGet,
    checkAvailability,
    storageState: readonly(storageState)
  };
};
