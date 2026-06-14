import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchFifaTeamsForDate, EMPTY_TEAM_DATA, type FifaTeamData } from '@/data/fifaLive';

const FifaTeamsContext = createContext<FifaTeamData>(EMPTY_TEAM_DATA);

export function FifaTeamsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FifaTeamData>(EMPTY_TEAM_DATA);

  useEffect(() => {
    let cancelled = false;
    fetchFifaTeamsForDate(new Date()).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, []);

  return <FifaTeamsContext.Provider value={data}>{children}</FifaTeamsContext.Provider>;
}

export function useFifaTeams(): FifaTeamData {
  return useContext(FifaTeamsContext);
}