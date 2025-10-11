'use client';

import { useParams } from 'next/navigation';
import { AppHeader } from './AppHeader';

export const HeaderWrapper: React.FC = () => {
  const params = useParams();
  const projectId = params?.id as string | undefined;

  return <AppHeader projectId={projectId} />;
};
