import { ArrowRight, Check, Clock3 } from 'lucide-react';
import type { EventPlan, EventRecord } from '@/domain/contracts';
import { formatDate } from '@/domain/format';
import { toggleTask } from '@/domain/plan-updates';

export function UpcomingTasks({
  event,
  onUpdate,
  onOpen,
}: {
  event: EventRecord;
  onUpdate: (plan: EventPlan) => void;
  onOpen: () => void;
}) {
  const pending = event.plan.tasks
    .filter((task) => !task.completed)
    .slice(0, 4);
  return (
    <section className="panel upcoming-panel">
      <div className="section-heading">
        <h2>A few little next steps</h2>
        <button className="text-button" onClick={onOpen}>
          View timeline <ArrowRight size={14} />
        </button>
      </div>
      <p className="section-description">
        A little progress today. More peace of mind tomorrow.
      </p>
      <div className="upcoming-list">
        {pending.map((task) => (
          <label className="upcoming-task" key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onUpdate(toggleTask(event.plan, task.id))}
            />
            <span className="custom-check" aria-hidden="true">
              <Check size={12} />
            </span>
            <span className="task-info">
              <strong>{task.title}</strong>
              <small>
                {task.category} <span>·</span> {formatDate(task.dueDate)}
              </small>
            </span>
            <Clock3 size={15} className="task-clock" />
          </label>
        ))}
        {pending.length === 0 && (
          <div className="all-done">
            <Check size={28} />
            <h3>Look at you, all caught up.</h3>
            <p>Every little step is complete. Take a moment to celebrate.</p>
          </div>
        )}
      </div>
    </section>
  );
}
