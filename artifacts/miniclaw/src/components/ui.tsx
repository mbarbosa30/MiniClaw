import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '@/lib/theme';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost'|'destructive', size?: 'sm'|'md'|'lg'|'icon' }>(
  ({ className, variant = 'primary', size = 'md', children, style, ...props }, ref) => {
    const t = useTheme();

    const base = "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none select-none rounded-xl";

    const variantStyle: React.CSSProperties = variant === 'primary'
      ? { background: t.text, color: t.bg, border: `1px solid ${t.text}` }
      : variant === 'secondary'
      ? { background: t.surface, color: t.text, border: `1px solid ${t.divider}` }
      : variant === 'destructive'
      ? { background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }
      : { background: 'transparent', color: t.text, border: 'none' };

    const sizes = {
      sm:   "px-3 py-1.5 text-sm",
      md:   "px-4 py-2.5 text-[15px]",
      lg:   "px-6 py-3.5 text-base",
      icon: "p-2.5",
    };

    return (
      <button ref={ref} className={cn(base, sizes[size], className)} style={{ ...variantStyle, ...style }} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => {
    const t = useTheme();
    return (
      <input
        ref={ref}
        className={cn("w-full focus:outline-none transition-colors duration-150 placeholder:opacity-40", className)}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          background: t.surface,
          border: `1px solid ${t.divider}`,
          color: t.text,
          fontSize: 14,
          fontFamily: 'inherit',
          ...style,
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => {
    const t = useTheme();
    return (
      <textarea
        ref={ref}
        className={cn("w-full focus:outline-none transition-colors duration-150 placeholder:opacity-40 resize-none", className)}
        style={{
          padding: '10px 14px',
          borderRadius: 12,
          background: t.surface,
          border: `1px solid ${t.divider}`,
          color: t.text,
          fontSize: 14,
          fontFamily: 'inherit',
          lineHeight: 1.6,
          ...style,
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Card = ({ className, children, ...props }: HTMLMotionProps<"div">) => {
  const t = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl", className)}
      style={{ background: t.surface, border: `1px solid ${t.divider}` }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const Switch = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => {
  const t = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        height: 24,
        width: 44,
        flexShrink: 0,
        cursor: 'pointer',
        alignItems: 'center',
        borderRadius: 9999,
        border: 'none',
        transition: 'background 0.2s',
        background: checked ? t.text : t.surface,
        outline: 'none',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          height: 18,
          width: 18,
          borderRadius: 9999,
          background: t.bg,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(22px)' : 'translateX(3px)',
          transition: 'transform 0.2s',
          pointerEvents: 'none',
        }}
      />
    </button>
  );
};

export const ScreenHeader = ({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) => {
  const t = useTheme();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: t.bg,
      borderBottom: `1px solid ${t.divider}`,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      transition: 'background 0.3s ease',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '33%' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '8px',
              marginLeft: -8,
              borderRadius: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: t.label,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
        )}
      </div>
      <h1 style={{
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: t.text,
        textAlign: 'center',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{title}</h1>
      <div style={{ width: '33%', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  );
};
