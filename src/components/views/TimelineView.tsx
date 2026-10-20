'use client';

import { useState } from 'react';
import { toggleTask } from '@/domain/plan-updates';
import { getTaskProgress } from '@/domain/workspace';
import type { PlanViewProps } from './types';
import { ViewHeading } from './ViewHeading';
import { ViewFilters } from './ViewFilters';
import { TimelineSummary, TaskList } from './TimelineParts';

type TaskFilter = 'all' | 'pending' | 'completed';

export function TimelineView({ event, onUpdate }: PlanViewProps) {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const { tasks } = event.plan;
  const { completed } = getTaskProgress(tasks);
  const visible = tasks.filter(
    (task) => filter === 'all' || task.completed === (filter === 'completed'),
  );
  return (
    <section className="workspace-view" aria-label="Event timeline">
      <ViewHeading
        eyebrow="One lovely step at a time"
        title="A plan for your peace of mind."
        description="From the first idea to the final detail, keep your celebration on track."
      />
      <TimelineSummary tasks={tasks} date={event.brief.date} />
      <ViewFilters<TaskFilter>
        label="Filter timeline tasks"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All tasks', count: tasks.length },
          { value: 'pending', label: 'To do', count: tasks.length - completed },
          { value: 'completed', label: 'Completed', count: completed },
        ]}
      />
      <TaskList
        tasks={visible}
        pending={filter === 'pending'}
        onToggle={(id) => onUpdate(toggleTask(event.plan, id))}
      />
    </section>
  );
}
