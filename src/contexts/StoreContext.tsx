import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Store } from '../types';
import { storesApi } from '../api/stores';
import { useAuth } from './AuthContext';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  isLoading: boolean;
  refetchStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    if (!isAuthenticated) {
      setStores([]);
      setCurrentStoreState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await storesApi.getAll({ limit: 100 });
      setStores(response.data);

      // Restore last selected store from localStorage or select first store
      const savedStoreId = localStorage.getItem('currentStoreId');
      if (savedStoreId) {
        const savedStore = response.data.find(s => s.id === savedStoreId);
        if (savedStore) {
          setCurrentStoreState(savedStore);
        } else if (response.data.length > 0) {
          setCurrentStoreState(response.data[0]);
        }
      } else if (response.data.length > 0) {
        setCurrentStoreState(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch stores when authentication state changes
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const setCurrentStore = (store: Store | null) => {
    setCurrentStoreState(store);
    if (store) {
      localStorage.setItem('currentStoreId', store.id);
    } else {
      localStorage.removeItem('currentStoreId');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        setCurrentStore,
        isLoading,
        refetchStores: fetchStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
