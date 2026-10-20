import {
  ArrowUpRight,
  Bookmark,
  Check,
  Flower2,
  Heart,
  Sparkles,
  Sun,
} from 'lucide-react';
import type { EventPlan } from '@/domain/contracts';

const ideaIcons = [Flower2, Sun, Heart, Sparkles] as const;

export function IdeaCard({
  idea,
  index,
  onSave,
}: {
  idea: EventPlan['ideas'][number];
  index: number;
  onSave: () => void;
}) {
  const Icon = ideaIcons[index % ideaIcons.length] ?? Flower2;
  return (
    <article className="idea-card">
      <div className={`idea-art idea-art-${index % 4}`} aria-hidden="true">
        <span className="idea-art-orbit" />
        <span className="idea-art-shape" />
        <Icon size={64} strokeWidth={1} />
        <span className="idea-art-star">✳</span>
        <span className="idea-art-caption">a moment to remember</span>
      </div>
      <div className="idea-content">
        <span className="idea-tag">
          {idea.tag}
          <ArrowUpRight size={13} aria-hidden="true" />
        </span>
        <h3>{idea.title}</h3>
        <p>{idea.description}</p>
        <button
          className={idea.saved ? 'idea-save is-saved' : 'idea-save'}
          onClick={onSave}
          type="button"
          aria-pressed={idea.saved}
        >
          {idea.saved ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Bookmark size={16} aria-hidden="true" />
          )}
          {idea.saved ? 'Saved to your collection' : 'Save this idea'}
        </button>
      </div>
    </article>
  );
}
