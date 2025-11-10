export default function Footer() {
  return (
    <footer className="bg-base-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">MixChat</h3>
            <p className="text-base-content/70">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            <ul className="space-y-2 text-base-content/70">
              <li>About</li>
              <li>Services</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="text-base-content/70">
              Email: mixchat@example.com<br />
              Phone: +82 10-1234-5678
            </p>
          </div>
        </div>
        <div className="divider"></div>
        <div className="text-center text-base-content/60">
          <p>&copy; 2025 Triple Star. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}