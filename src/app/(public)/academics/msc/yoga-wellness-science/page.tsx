import type { Metadata } from 'next';
import MscDisciplinePage from '@/features/academics/components/MscDisciplinePage';
import { getMscDiscipline } from '@/features/academics/msc-content';

export const metadata: Metadata = {
  title: 'M.Sc. in Yoga & Wellness Science',
  description: 'Explore the M.Sc. in Yoga & Wellness Science at CTIKS, IIT Bombay.',
};

export default function YogaWellnessSciencePage() {
  return <MscDisciplinePage discipline={getMscDiscipline('yoga-wellness-science')} />;
}
