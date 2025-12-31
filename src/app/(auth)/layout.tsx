export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 dark:text-green-100">
            Produccion Ivanis
          </h1>
          <p className="text-green-600 dark:text-green-300 mt-2">
            Sistema de Gestion Porcina
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
