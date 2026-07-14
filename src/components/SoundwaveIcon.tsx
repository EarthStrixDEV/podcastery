import { cn } from '@/lib/utils'

interface SoundwaveIconProps {
  className?: string
  barClassName?: string
}

const BARS = [
  { duration: '0.9s', delay: '0s' },
  { duration: '1.1s', delay: '0.15s' },
  { duration: '0.75s', delay: '0.3s' },
  { duration: '1s', delay: '0.05s' },
]

export function SoundwaveIcon({ className, barClassName }: SoundwaveIconProps) {
  return (
    <div className={cn('flex h-4 items-end gap-0.5', className)} aria-hidden="true">
      {BARS.map((bar, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-full bg-white animate-soundwave', barClassName)}
          style={{ animationDuration: bar.duration, animationDelay: bar.delay }}
        />
      ))}
    </div>
  )
}
