export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Master English with
          <span className="text-emerald-400"> AI Chat</span>
        </h1>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          Practice conversation skills with AI tutors and connect with learners
          worldwide. Automatically save new vocabulary to your personal learning
          notes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/chat"
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Start Chatting
          </a>
          <a
            href="/auth/signup"
            className="border-2 border-emerald-600 text-emerald-400 px-8 py-3 rounded-lg text-lg font-medium hover:bg-emerald-600 hover:text-white transition-colors"
          >
            Sign Up Free
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">AI Chat</h3>
            <p className="text-gray-300">
              Chat with AI tutors for personalized English practice and instant
              feedback.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">User Chat</h3>
            <p className="text-gray-300">
              Connect with learners worldwide through 1:1 and group chat rooms.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">
              Learning Notes
            </h3>
            <p className="text-gray-300">
              Automatically save and review vocabulary you encounter during
              conversations.
            </p>
          </div>
        </div>
      </section>

      {/* Translation Feature */}
      <section className="py-16 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Smart Translation
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Mix languages naturally and let AI help translate. Unknown words are
            automatically saved to your learning notes.
          </p>
          <div className="bg-gray-900 p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-gray-700">
            <div className="text-left">
              <p className="text-gray-400 text-sm mb-2">You type:</p>
              <p className="text-lg mb-4 text-gray-200">
                "I want to go to the 도서관 to study"
              </p>
              <p className="text-gray-400 text-sm mb-2">AI translates:</p>
              <p className="text-lg text-emerald-400">
                "I want to go to the library to study"
              </p>
              <p className="text-sm text-gray-400 mt-3">
                ✓ "도서관 → library" saved to learning notes
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
