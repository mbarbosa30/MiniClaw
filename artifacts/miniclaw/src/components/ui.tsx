import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'destructive', size?: 'sm'|'md'|'lg'|'icon' }>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none select-none";

    const variants = {
      primary:     "bg-primary text-primary-foreground rounded-xl border border-primary/80 shadow-sm hover:opacity-90",
      secondary:   "bg-neutral-100 text-foreground rounded-xl border border-neutral-200 hover:bg-neutral-200/80",
      ghost:       "bg-transparent text-foreground rounded-xl hover:bg-black/[0.04]",
      destructive: "bg-transparent text-destructive rounded-xl border border-destructive/20 hover:bg-destructive/5",
    };

    const sizes = {
      sm:   "px-3 py-1.5 text-sm",
      md:   "px-4.5 py-2.5 text-[15px]",
      lg:   "px-6 py-3.5 text-base",
      icon: "p-2.5",
    };

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:border-primary/60 focus:outline-none transition-colors duration-150 text-[15px] text-foreground placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 focus:border-primary/60 focus:outline-none transition-colors duration-150 text-[15px] text-foreground placeholder:text-muted-foreground resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Card = ({ className, children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-2xl border border-neutral-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]", className)}
    {...props}
  >
    {children}
  </motion.div>
);

export const Switch = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 focus:outline-none",
      checked ? "bg-primary" : "bg-neutral-300"
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200",
        checked ? "translate-x-5" : "translate-x-0.5"
      )}
    />
  </button>
);

export const ScreenHeader = ({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-neutral-100 sticky top-0 z-10">
    <div className="flex items-center gap-1 w-1/3">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-1 rounded-lg text-foreground/60 hover:text-foreground hover:bg-neutral-100 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}
    </div>
    <h1 className="font-semibold text-[16px] tracking-tight text-center flex-1 truncate">{title}</h1>
    <div className="w-1/3 flex justify-end">
      {rightAction}
    </div>
  </div>
);
