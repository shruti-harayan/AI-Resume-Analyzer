export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">⛔</div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Access Denied
        </h2>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You do not have permission to view this page with your current account.
        </p>

        {/* Back Button */}
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-md hover:opacity-90 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}
