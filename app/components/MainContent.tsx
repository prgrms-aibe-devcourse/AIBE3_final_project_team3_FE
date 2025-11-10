interface MainContentProps {
  children?: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 bg-base-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {children || <h2 className="text-xl font-semibold">Main Content</h2>}
      </div>
    </main>
  );
}