type MainLayoutProps = {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {children}
    </div>
  )
}
