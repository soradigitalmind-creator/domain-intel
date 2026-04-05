"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type TrailItem = { href: string; label: string };

type TrailContextType = {
  topicTrail: TrailItem[];
  setTopicTrail: (items: TrailItem[]) => void;
};

const TrailContext = createContext<TrailContextType>({
  topicTrail: [],
  setTopicTrail: () => {},
});

export function TrailProvider({ children }: { children: React.ReactNode }) {
  const [topicTrail, setTopicTrail] = useState<TrailItem[]>([]);
  return (
    <TrailContext.Provider value={{ topicTrail, setTopicTrail }}>
      {children}
    </TrailContext.Provider>
  );
}

export function useTrailContext() {
  return useContext(TrailContext);
}

export function SetTrail({ items }: { items: TrailItem[] }) {
  const { setTopicTrail } = useContext(TrailContext);
  useEffect(() => {
    setTopicTrail(items);
    return () => setTopicTrail([]);
  }, [items, setTopicTrail]);
  return null;
}
