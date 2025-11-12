export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-8 border-t border-slate-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-emerald-400">
              EnglishChat
            </h3>
            <p className="text-gray-300">
              Learn English through AI-powered conversations and connect with
              learners worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/chat"
                  className="text-gray-300 hover:text-emerald-400 transition-colors"
                >
                  Chat
                </a>
              </li>
              <li>
                <a
                  href="/learning-notes"
                  className="text-gray-300 hover:text-emerald-400 transition-colors"
                >
                  Learning Notes
                </a>
              </li>
              <li>
                <a
                  href="/profile"
                  className="text-gray-300 hover:text-emerald-400 transition-colors"
                >
                  My Page
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
            <div className="text-gray-300">
              <p>Email: support@englishchat.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 EnglishChat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
