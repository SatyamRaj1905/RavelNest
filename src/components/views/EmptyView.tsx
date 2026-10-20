import { Leaf } from 'lucide-react';

export function EmptyView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="view-empty" role="status">
      <span className="view-empty-icon">
        <Leaf size={24} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
