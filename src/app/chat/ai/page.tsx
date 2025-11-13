import Link from "next/link";

export default function AIChatPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-white">🤖 AI Chat</h1>
        <p className="text-gray-300">Choose your AI conversation experience</p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Chat */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-600 hover:border-emerald-400 transition-colors">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗣️</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Free Chat</h2>
            <p className="text-gray-300 mb-6">
              Casual conversation practice with instant feedback and real-time
              translation support.
            </p>

            <ul className="text-left text-sm text-gray-300 mb-6 space-y-2">
              <li>✓ Natural conversation flow</li>
              <li>✓ Real-time AI feedback</li>
              <li>✓ Grammar & vocabulary tips</li>
              <li>✓ Korean-English translation</li>
            </ul>

            <Link
              href="/chat/ai/free"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors inline-block shadow-lg"
            >
              Start Free Chat
            </Link>
          </div>
        </div>

        {/* Roleplay Chat */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-600 hover:border-purple-400 transition-colors">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎭</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Roleplay Chat
            </h2>
            <p className="text-gray-300 mb-6">
              Practice English in specific scenarios like job interviews,
              restaurants, and travel situations.
            </p>

            <ul className="text-left text-sm text-gray-300 mb-6 space-y-2">
              <li>🏢 Job interviews</li>
              <li>🍽️ Restaurant ordering</li>
              <li>✈️ Travel scenarios</li>
              <li>🛍️ Shopping situations</li>
            </ul>

            <Link
              href="/chat/ai/roleplay"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors inline-block shadow-lg opacity-75"
            >
              Coming Soon
            </Link>
          </div>
        </div>
      </div>

      {/* Back to Chat Menu */}
      <div className="text-center mt-8">
        <Link
          href="/chat"
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Chat Menu
        </Link>
      </div>
    </div>
  );
}
