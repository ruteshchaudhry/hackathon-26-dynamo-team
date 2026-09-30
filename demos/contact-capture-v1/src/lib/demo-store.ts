/**
 * In-memory demo state shared across the Outlook, Contact Capture and Dynamics
 * screens. Lives for the browser session; resets on page refresh or resetDemo().
 * Only the integration adapters write to it.
 */
import { useSyncExternalStore } from "react";
import type { RelationshipType } from "@/lib/mock-data";
import type { SyncState } from "@/lib/dynamine-store";

export interface CreatedContact {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  premisesId: string;
  relationshipType: RelationshipType | "";
  relatedPremises?: string;
  relationshipId: string;
  sourceMessageId?: string | undefined;
  createdAt: string;
}

export interface DemoState {
  created: CreatedContact[];
  processedMessageIds: string[];
  readMessageIds: string[];
  lastAddedIds: string[];
  resetCount: number;
  sync: SyncState | null;
}

const initial = (): DemoState => ({
  created: [],
  processedMessageIds: [],
  readMessageIds: [],
  lastAddedIds: [],
  resetCount: 0,
  sync: null,
});

let state: DemoState = initial();
const listeners = new Set<() => void>();
const serverSnapshot = initial();

export function getDemoState() {
  return state;
}

export function setDemoState(fn: (s: DemoState) => DemoState) {
  state = fn(state);
  listeners.forEach((l) => l());
}

export function resetDemo() {
  setDemoState((s) => ({ ...initial(), resetCount: s.resetCount + 1 }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDemoState() {
  return useSyncExternalStore(subscribe, getDemoState, () => serverSnapshot);
}
