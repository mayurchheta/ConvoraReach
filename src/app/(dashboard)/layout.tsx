import { Toaster } from "sonner"

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" theme="dark" richColors />
    </>
  )
}
