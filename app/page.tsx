export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Hello DaisyUI!</h1>
            <p className="py-6">
              DaisyUI has been successfully installed and configured in your Next.js project!
            </p>

            {/* DaisyUI Button Examples */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button className="btn btn-primary">Primary Button</button>
              <button className="btn btn-secondary">Secondary Button</button>
              <button className="btn btn-accent">Accent Button</button>
            </div>

            {/* DaisyUI Card Example */}
            <div className="card w-96 bg-base-100 shadow-xl mt-8">
              <div className="card-body">
                <h2 className="card-title">DaisyUI Card!</h2>
                <p>This is a beautiful card component from DaisyUI.</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Buy Now</button>
                </div>
              </div>
            </div>

            {/* DaisyUI Badge Examples */}
            <div className="flex gap-2 justify-center mt-4">
              <div className="badge badge-primary">Primary</div>
              <div className="badge badge-secondary">Secondary</div>
              <div className="badge badge-accent">Accent</div>
              <div className="badge badge-ghost">Ghost</div>
            </div>

            {/* DaisyUI Alert Example */}
            <div className="alert alert-success mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>DaisyUI is working perfectly!</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
