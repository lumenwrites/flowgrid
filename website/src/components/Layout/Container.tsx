import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
  noPadding?: boolean
  wide?: boolean
  className?: string
}

export default function Container({
  children,
  noPadding = false,
  wide = false,
  className = '',
}: ContainerProps) {
  return (
    <div className={noPadding ? '' : 'px-1 sm:px-4'}>
      <div className={cn('m-auto', !wide && 'max-w-screen-md', wide && 'max-w-screen-lg', className)}>
        {children}
      </div>
    </div>
  )
}
