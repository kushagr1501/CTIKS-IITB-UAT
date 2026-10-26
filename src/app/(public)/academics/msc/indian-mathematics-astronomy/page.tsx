import type { Metadata } from 'next';
import MscDisciplinePage from '@/features/academics/components/MscDisciplinePage';
import { getMscDiscipline } from '@/features/academics/msc-content';

export const metadata: Metadata = {
  title: 'M.Sc. in Indian Mathematics & Astronomy',
  description: 'Explore the M.Sc. in Indian Mathematics & Astronomy at CTIKS, IIT Bombay.',
};

export default function IndianMathematicsAstronomyPage() {
  return <MscDisciplinePage discipline={getMscDiscipline('indian-mathematics-astronomy')} />;
}
