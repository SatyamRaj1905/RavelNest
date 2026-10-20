import { ArrowUpRight, Flower, Leaf, Sparkles } from 'lucide-react';

export function InspirationBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="inspiration-banner" onClick={onOpen}>
      <span className="inspiration-art" aria-hidden="true">
        <Flower size={48} strokeWidth={1} />
        <Leaf size={24} strokeWidth={1.3} />
      </span>
      <span>
        <span className="eyebrow">A LITTLE SPARK FOR YOUR NEXT BIG THING</span>
        <strong>Make it meaningful. Make it yours.</strong>
        <span>
          Thoughtful touches, fresh ideas & a little unexpected magic.
        </span>
      </span>
      <span className="inspiration-cta">
        Find your inspiration <ArrowUpRight size={17} />
      </span>
      <Sparkles className="inspiration-sparkles" size={20} />
    </button>
  );
}
