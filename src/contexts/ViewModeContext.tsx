import { createContext, useContext, useState, ReactNode } from 'react';

type ViewMode = 'pc' | 'mobile';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isForcedMobile: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'pc',
  setViewMode: () => {},
  isForcedMobile: false,
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('pc');

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      setViewMode,
      isForcedMobile: viewMode === 'mobile',
    }}>
      <div className={viewMode === 'mobile' ? 'max-w-[430px] mx-auto border-x border-border min-h-screen' : ''}>
        {children}
      </div>
    </ViewModeContext.Provider>
  );
}

export const useViewMode = () => useContext(ViewModeContext);
