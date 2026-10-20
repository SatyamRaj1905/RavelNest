import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import type { EventPlan, EventRecord, PlanResponse } from '@/domain/contracts';
import { useGeneration } from './use-generation';
import { applySuggestions } from '@/domain/plan-updates';

function AssistantResult({
  result,
  onApply,
}: {
  result: PlanResponse;
  onApply: () => void;
}) {
  const [applied, setApplied] = useState(false);
  return (
    <div className="assistant-result">
      <span className="source-badge">
        {result.source === 'gemini' ? 'Gemini suggestions' : 'Demo suggestions'}
      </span>
      <p>{result.plan.summary}</p>
      {result.plan.ideas.slice(0, 2).map((idea) => (
        <p key={idea.id}>
          <strong>{idea.title}</strong>
          <br />
          {idea.description}
        </p>
      ))}
      <p className="assistant-notice">{result.notice}</p>
      <button
        className="button secondary"
        disabled={applied}
        onClick={() => {
          onApply();
          setApplied(true);
        }}
      >
        <Check size={15} />
        {applied ? 'Suggestions saved' : 'Apply suggestions'}
      </button>
    </div>
  );
}

function AssistantHeading() {
  return (
    <div className="assistant-heading">
      <span className="assistant-symbol">
        <Sparkles size={21} />
      </span>
      <div>
        <h2>Your planning companion</h2>
        <span>A little intelligence. A lot of heart.</span>
      </div>
      <span className="ai-tag">AI</span>
    </div>
  );
}

function AssistantIntro({
  loading,
  onPrompt,
}: {
  loading: boolean;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <>
      <span className="assistant-flower" aria-hidden="true">
        ✳
      </span>
      <h3>
        Good things start
        <br /> with a little idea.
      </h3>
      <p>
        From “where do I begin?” to “that’s so us.”
        <br /> Let’s make this one feel like you.
      </p>
      <div className="prompt-chips">
        {['Stretch my budget', 'Make it personal', 'Plan sustainably'].map(
          (text) => (
            <button
              key={text}
              onClick={() => onPrompt(text)}
              disabled={loading}
            >
              {text}
              <ArrowUpRight size={14} />
            </button>
          ),
        )}
      </div>
    </>
  );
}

type ComposerProps = {
  prompt: string;
  loading: boolean;
  onPrompt: (prompt: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
function AssistantComposer({
  prompt,
  loading,
  onPrompt,
  onSubmit,
}: ComposerProps) {
  return (
    <form className="assistant-input" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="assistant-prompt">
        Ask your planning assistant
      </label>
      <input
        id="assistant-prompt"
        value={prompt}
        onChange={(e) => onPrompt(e.target.value)}
        placeholder="A little help with your next big idea…"
        maxLength={1200}
        required
      />
      <button aria-label="Send message" disabled={loading}>
        <Send size={17} />
      </button>
    </form>
  );
}

export function Assistant({
  event,
  onUpdate,
}: {
  event: EventRecord;
  onUpdate: (plan: EventPlan, source?: EventRecord['source']) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const { state, generate } = useGeneration();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (prompt.trim()) void generate(event.brief, prompt);
  }
  function selectPrompt(text: string) {
    setPrompt(text);
    void generate(event.brief, text);
  }
  function apply() {
    if (state.status === 'ready')
      onUpdate(
        applySuggestions(event.plan, state.result.plan),
        state.result.source,
      );
  }
  return (
    <aside className="assistant-panel">
      <AssistantHeading />
      <div className="assistant-body">
        <AssistantIntro
          loading={state.status === 'loading'}
          onPrompt={selectPrompt}
        />
        {state.status === 'loading' && (
          <p className="assistant-loading" role="status">
            <LoaderCircle size={17} className="spin" /> Thinking through the
            little details…
          </p>
        )}
        {state.status === 'ready' && (
          <AssistantResult
            key={state.result.plan.summary + prompt}
            result={state.result}
            onApply={apply}
          />
        )}
      </div>
      <AssistantComposer
        prompt={prompt}
        loading={state.status === 'loading'}
        onPrompt={setPrompt}
        onSubmit={submit}
      />
      <p className="assistant-footer">
        <span className="online-dot" /> Gemini when configured · Demo always
        available
      </p>
    </aside>
  );
}
