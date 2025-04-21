import { createContext, useContext, useMemo, useCallback } from 'react';
import WiseekrApiClient from '../WiseekrApiClient';
import { useFlash } from './FlashProvider';

const ApiContext = createContext();

export default function ApiProvider({ children }) {
  const flash = useFlash();

  const onError = useCallback(() => {
    flash('An unexpected error occurred', 'danger');
  }, [flash]);

  const api = useMemo(() => new WiseekrApiClient(onError), [onError]);

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  return useContext(ApiContext);
}