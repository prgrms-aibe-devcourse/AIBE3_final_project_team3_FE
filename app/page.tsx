export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-base-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Header</h1>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 bg-base-100">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold">Main Content</h2>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-base-300">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center">Footer</p>
        </div>
      </footer>
    </div>
  );
}
