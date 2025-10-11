import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  name: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav className={clsx('bg-transparent', className)}>
      <ol className="flex items-center bg-transparent">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="flex items-center bg-transparent">
            <div className="flex items-center bg-transparent">
              <div className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium relative',
                stepIdx < currentStep
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : stepIdx === currentStep
                  ? 'border-orange-500 text-orange-500 bg-neutral-900'
                  : 'border-neutral-600 text-neutral-400 bg-neutral-900'
              )}>
                {stepIdx < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{stepIdx + 1}</span>
                )}
              </div>
              <div className="ml-3 bg-transparent">
                <p className={clsx(
                  'text-sm font-medium bg-transparent',
                  stepIdx <= currentStep ? 'text-white' : 'text-neutral-400'
                )}>
                  {step.name}
                </p>
                {step.description && (
                  <p className="text-xs text-neutral-300 bg-transparent">{step.description}</p>
                )}
              </div>
            </div>
            {stepIdx < steps.length - 1 && (
              <div className={clsx(
                'h-0.5 w-16 mx-6',
                stepIdx < currentStep ? 'bg-orange-500' : 'bg-neutral-600'
              )} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
