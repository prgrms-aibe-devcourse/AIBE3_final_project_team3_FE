import { Suspense } from "react";
import FindPageClient from "./FindPageClient";

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-gray-400">Loading find experience...</div>
);

export const dynamic = "force-dynamic";

export default function FindPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <FindPageClient />
    </Suspense>
  );
}
