import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-qiwa-primary text-white hover:bg-qiwa-hover active:bg-qiwa-secondary focus-visible:ring-qiwa-accent',
        outline: 'border-2 border-qiwa-primary text-qiwa-primary bg-white hover:bg-qiwa-light hover:border-qiwa-accent hover:text-qiwa-accent',
        secondary: 'bg-qiwa-secondary text-white hover:bg-qiwa-hover active:bg-qiwa-accent',
        ghost: 'text-qiwa-primary hover:bg-qiwa-light hover:text-qiwa-accent',
        link: 'text-qiwa-primary underline-offset-4 hover:underline hover:text-qiwa-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6 text-lg font-bold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 