export default function ChatPage() {
  return (
    <main className="flex-1 hidden md:flex items-center justify-center text-center">
      <div>
        <div className="text-3xl mb-4">💬</div>
        <h2 className="text-2xl font-semibold text-gray-300">
          Select a chat to start messaging
        </h2>
        <p className="text-gray-500 mt-2">
          Choose a friend, group, or AI tutor from the sidebar.
        </p>
      </div>
    </main>
  );
}
