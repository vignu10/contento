'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Content {
  id: string;
  title: string | null;
  sourceType: string;
  status: string;
  createdAt: string;
  _count?: { outputs: number };
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // YouTube input state
  const [youtubeUrl, setYoutubeUrl] = useState('');

  useEffect(() => {
    fetchUser();
    fetchContents();
  }, []);

  async function fetchUser() {
    const res = await fetch('/api/auth');
    const data = await res.json();
    if (!data.user) {
      router.push('/');
      return;
    }
    setUser(data.user);
  }

  async function fetchContents() {
    const res = await fetch('/api/content');
    const data = await res.json();
    setContents(data.contents || []);
    setLoading(false);
  }

  async function handleYoutubeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        body: JSON.stringify({
          sourceType: 'youtube',
          sourceUrl: youtubeUrl,
          userId: user?.id,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setYoutubeUrl('');
        fetchContents();
      }
    } catch (error) {
      console.error('Failed to process:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
      headers: { 'Content-Type': 'application/json' }
    });
    router.push('/');
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">Contento</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-300">
              {user?.name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* New Content Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Process New Content</h2>
          
          {/* YouTube Input */}
          <form onSubmit={handleYoutubeSubmit} className="flex gap-3">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={processing}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {processing ? 'Processing...' : 'Process'}
            </button>
          </form>
        </div>

        {/* Content History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Content</h2>
          
          {contents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No content processed yet. Paste a YouTube URL above to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/content/${content.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">
                        {content.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {content.sourceType.toUpperCase()} • {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(content.status)}`}>
                        {content.status}
                      </span>
                      {content._count?.outputs && (
                        <span className="text-sm text-gray-500">
                          {content._count.outputs} outputs
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
