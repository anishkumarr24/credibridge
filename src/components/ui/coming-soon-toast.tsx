"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ToastData {
  feature: string;
  id: number;
}

interface ComingSoonContextType {
  show: (feature: string) => void;
}

const ComingSoonContext = React.createContext<ComingSoonContextType>({
  show: () => {},
});

export function useComingSoon() {
  return React.useContext(ComingSoonContext);
}

export function ComingSoonProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastData | null>(null);

  const show = React.useCallback((feature: string) => {
    setToast({ feature, id: Date.now() });
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ComingSoonContext.Provider value={{ show }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="flex items-center gap-3 rounded-full border bg-card/95 backdrop-blur-lg px-5 py-3 shadow-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="pr-1">
                <p className="text-sm font-medium whitespace-nowrap">{toast.feature}</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ComingSoonContext.Provider>
  );
}
