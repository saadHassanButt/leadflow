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
    <nav className={clsx('w-full', className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="flex items-center flex-1">
            <div className="flex items-center">
              <div className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                stepIdx < currentStep
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : stepIdx === currentStep
                  ? 'border-primary-500 text-primary-500 bg-white'
                  : 'border-neutral-300 text-neutral-400 bg-white'
              )}>
                {stepIdx < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{stepIdx + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={clsx(
                  'text-sm font-medium',
                  stepIdx <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
                )}>
                  {step.name}
                </p>
                {step.description && (
                  <p className="text-xs text-neutral-500">{step.description}</p>
                )}
              </div>
            </div>
            {stepIdx < steps.length - 1 && (
              <div className={clsx(
                'flex-1 h-0.5 mx-4',
                stepIdx < currentStep ? 'bg-primary-500' : 'bg-neutral-200'
              )} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
