import { useEffect, useRef, useState } from 'react';
import type { EventBrief, PlanResponse } from '@/domain/contracts';
import { requestPlan } from '@/client/request-plan';

type Generation =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: PlanResponse; brief: EventBrief };

export function useGeneration() {
  const [state, setState] = useState<Generation>({ status: 'idle' });
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );
  async function generate(brief: EventBrief, prompt = '') {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setState({ status: 'loading' });
    try {
      const result = await requestPlan(brief, prompt, request.signal);
      if (!request.signal.aborted) setState({ status: 'ready', result, brief });
    } catch {
      if (!request.signal.aborted)
        setState({
          status: 'error',
          message: 'Your plan could not be prepared. Please try again.',
        });
    }
  }
  function reset() {
    controller.current?.abort();
    setState({ status: 'idle' });
  }
  return { state, generate, reset };
}
