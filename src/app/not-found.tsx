import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-3xl text-stone-800 mb-3">
          Page Not Found
        </h1>
        <p className="text-stone-500 leading-relaxed mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900"
        >
          Return to the Manor
        </Link>
        <div className="mt-10 pt-6 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            House of Nannies · New York Area
          </p>
        </div>
      </div>
    </div>
  );
}
