import { Studio } from '@/components/studio';
import { createSampleWorkspace } from '@/domain/sample';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <Studio initial={createSampleWorkspace()} />;
}
