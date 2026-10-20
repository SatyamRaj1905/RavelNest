import type { EventPlan, EventRecord } from '@/domain/contracts';

export type PlanViewProps = {
  event: EventRecord;
  onUpdate: (plan: EventPlan) => void;
};
