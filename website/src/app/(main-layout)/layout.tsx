import Header from '@/components/Layout/Header'
import Footer from '@/components/Layout/Footer'

type MainLayoutProps = {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  )
}
