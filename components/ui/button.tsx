import * as React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2'
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default: 'bg-black text-white hover:bg-black/90',
      secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900',
      outline: 'border border-neutral-300 hover:bg-neutral-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    }
    return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
  }
)
Button.displayName = 'Button'
