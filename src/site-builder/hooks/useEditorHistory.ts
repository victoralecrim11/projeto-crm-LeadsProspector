import { useState, useCallback } from 'react';
import { GeneratedSiteBlueprint } from '../types';
import { SiteUserOverrides } from '../contracts/overrides';

export interface SiteEditorSnapshot {
  blueprint: GeneratedSiteBlueprint;
  overrides?: SiteUserOverrides;
}

export function useEditorHistory(initialSnapshot: SiteEditorSnapshot) {
  const [past, setPast] = useState<SiteEditorSnapshot[]>([]);
  const [present, setPresent] = useState<SiteEditorSnapshot>(initialSnapshot);
  const [future, setFuture] = useState<SiteEditorSnapshot[]>([]);

  const pushSnapshot = useCallback((newSnapshot: SiteEditorSnapshot) => {
    setPast((currentPast) => {
      const updatedPast = [...currentPast, present];
      // Keep only the last 50 snapshots
      if (updatedPast.length > 50) {
        return updatedPast.slice(updatedPast.length - 50);
      }
      return updatedPast;
    });
    setPresent(newSnapshot);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setPast(newPast);
    setFuture((currentFuture) => [present, ...currentFuture]);
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    
    const next = future[0];
    const newFuture = future.slice(1);
    
    setPast((currentPast) => [...currentPast, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  return {
    snapshot: present,
    pushSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
