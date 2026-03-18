import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

// --- BEAUTIFUL REUSABLE COMPONENTS ---

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'destructive', size?: 'sm'|'md'|'lg'|'icon' }>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 rounded-2xl",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl",
      ghost: "bg-transparent text-foreground hover:bg-black/5 rounded-2xl",
      destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-2xl",
    };
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-3.5 text-base",
      lg: "px-8 py-4 text-lg",
      icon: "p-3",
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
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-transparent focus:border-primary/10 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 text-foreground shadow-sm placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-transparent focus:border-primary/10 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 text-foreground shadow-sm placeholder:text-muted-foreground resize-none",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Card = ({ className, children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-card rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5", className)} 
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
      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
      checked ? "bg-primary" : "bg-muted-foreground/30"
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
);

export const ScreenHeader = ({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-xl sticky top-0 z-10 border-b border-black/5">
    <div className="flex items-center gap-3 w-1/3">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}
    </div>
    <h1 className="font-display font-semibold text-lg text-center flex-1 truncate">{title}</h1>
    <div className="w-1/3 flex justify-end">
      {rightAction}
    </div>
  </div>
);
