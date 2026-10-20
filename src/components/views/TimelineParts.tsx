import { CalendarDays, Check, Flag } from 'lucide-react';
import { daysUntil, formatDate } from '@/domain/format';
import { getTaskProgress } from '@/domain/workspace';
import type { PlanTask } from '@/domain/contracts';
import { EmptyView } from './EmptyView';

function TaskRow({ task, onToggle }: { task: PlanTask; onToggle: () => void }) {
  const overdue = !task.completed && daysUntil(task.dueDate) < 0;
  return (
    <li className={`timeline-task${task.completed ? ' is-completed' : ''}`}>
      <label className="timeline-task-check">
        <input type="checkbox" checked={task.completed} onChange={onToggle} />
        <span aria-hidden="true">{task.completed && <Check size={14} />}</span>
        <span className="sr-only">
          {task.completed ? 'Mark incomplete:' : 'Complete task:'} {task.title}
        </span>
      </label>
      <div className="timeline-task-content">
        <h3>{task.title}</h3>
        <span>{task.category}</span>
      </div>
      <span className={overdue ? 'task-date is-overdue' : 'task-date'}>
        <CalendarDays size={14} aria-hidden="true" />
        {formatDate(task.dueDate)}
        {overdue && <span>Overdue</span>}
      </span>
    </li>
  );
}

export function TimelineSummary({
  tasks,
  date,
}: {
  tasks: PlanTask[];
  date: string;
}) {
  const { completed, total, percent } = getTaskProgress(tasks);
  return (
    <div className="timeline-summary">
      <span className="timeline-summary-icon">
        <Flag size={23} aria-hidden="true" />
      </span>
      <div>
        <h3>Good things are coming together.</h3>
        <p>
          {completed} of {total} tasks complete · Your event is on{' '}
          {formatDate(date)}
        </p>
      </div>
      <strong>{percent}%</strong>
    </div>
  );
}

export function TaskList({
  tasks,
  pending,
  onToggle,
}: {
  tasks: PlanTask[];
  pending: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="view-panel timeline-panel">
      <div className="view-panel-heading">
        <h3>Your planning checklist</h3>
        <span>Check off a little progress</span>
      </div>
      {tasks.length ? (
        <ul className="timeline-tasks">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggle(task.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyView
          title={
            pending
              ? 'Every little detail is done.'
              : 'A fresh page, ready for progress.'
          }
          description={
            pending
              ? 'Take a breath. Your checklist is complete.'
              : 'Completed tasks will appear here as you check them off.'
          }
        />
      )}
    </div>
  );
}
