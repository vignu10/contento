import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Content Repurposing Pipeline
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Transform one piece of content into 10+ formats for all platforms
          </p>
        </header>

        {/* CTA */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-4 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">1</span>
              <span>Paste a YouTube URL or upload your content (video, audio, blog, PDF)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">2</span>
              <span>AI transcribes and analyzes your content in seconds</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">3</span>
              <span>Get Twitter threads, LinkedIn posts, newsletters, TikTok clips, and more</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">4</span>
              <span>Edit, download, or schedule directly to your platforms</span>
            </li>
          </ol>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6">Start Repurposing</h2>
          
          {/* YouTube URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">YouTube URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
                Process
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Upload video, audio, PDF, or document
            </p>
            <button className="mt-4 px-4 py-2 border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              Choose File
            </button>
          </div>
        </div>

        {/* Output Formats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">Output Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Twitter Thread', icon: '🐦' },
              { name: 'LinkedIn Post', icon: '💼' },
              { name: 'Newsletter', icon: '📧' },
              { name: 'TikTok Clips', icon: '🎬' },
              { name: 'Quote Graphics', icon: '💬' },
              { name: 'SEO Summary', icon: '🔍' },
              { name: 'Instagram Caption', icon: '📸' },
              { name: 'Show Notes', icon: '📝' },
            ].map((format) => (
              <div
                key={format.name}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <span className="text-2xl">{format.icon}</span>
                <p className="mt-2 text-sm font-medium">{format.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          Built by Izanagi for Vignu 🎯
        </footer>
      </div>
    </main>
  );
}
