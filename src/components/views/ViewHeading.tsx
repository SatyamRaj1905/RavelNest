import type { ReactNode } from 'react';

type ViewHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function ViewHeading({
  eyebrow,
  title,
  description,
  children,
}: ViewHeadingProps) {
  return (
    <header className="view-heading">
      <div>
        <span className="view-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}
