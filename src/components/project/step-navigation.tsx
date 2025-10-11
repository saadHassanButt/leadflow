'use client';

import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Stepper } from '@/components/ui';
import { PROJECT_STEPS } from '@/lib/constants';

interface StepNavigationProps {
  className?: string;
}

export function StepNavigation({ className }: StepNavigationProps) {
  const pathname = usePathname();

  // Determine current step based on pathname
  const getCurrentStep = () => {
    if (pathname.includes('/leads')) {
      return 0; // Discover Leads
    } else if (pathname.includes('/template')) {
      return 1; // Create Template
    } else if (pathname.includes('/campaign')) {
      return 2; // Launch Campaign
    }
    return 0; // Default to first step
  };

  const currentStep = getCurrentStep();

  return (
    <Stepper
      steps={PROJECT_STEPS}
      currentStep={currentStep}
      className={clsx('bg-transparent', className)}
    />
  );
}
