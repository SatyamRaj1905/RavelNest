import { Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { Dialog } from './dialog';

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="A little guidance, a lot of possibility." onClose={onClose}>
      <div className="help-content">
        <section>
          <Sparkles size={22} />
          <h3>From a thought to a thoughtful plan</h3>
          <p>
            Choose Create event, share your occasion and review a plan before
            saving. With a server-side Gemini key, the assistant personalizes
            your ideas. Demo mode uses a transparent, deterministic planning
            engine.
          </p>
        </section>
        <section>
          <Heart size={22} />
          <h3>Make every detail your own</h3>
          <p>
            Track actual spending in Budget, complete tasks in Timeline, record
            vendor progress and save ideas. Export a Markdown copy anytime.
            Allocations are estimates; vendors are categories to research, not
            verified businesses.
          </p>
        </section>
        <section>
          <LockKeyhole size={22} />
          <h3>Your space, on your device</h3>
          <p>
            Plans are stored in this browser. They don’t sync between devices
            and clearing browser data removes them. Your event brief is sent to
            the server when generating a plan; live mode sends only the
            necessary brief to Google Gemini. Don’t include sensitive guest
            information.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
