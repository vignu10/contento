'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Output {
  id: string;
  format: string;
  data: string;  // JSON string
  editedData: string | null;
  isExported: boolean;
}

function parseOutputData(output: Output) {
  try {
    return JSON.parse(output.editedData || output.data);
  } catch {
    return output.data;
  }
}

interface Content {
  id: string;
  title: string | null;
  sourceType: string;
  sourceUrl: string | null;
  status: string;
  transcript: string | null;
  outputs: Output[];
}

export default function ContentDetail() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('twitter_thread');
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  useEffect(() => {
    fetchContent();
    // Poll for updates if processing
    const interval = setInterval(() => {
      if (content?.status === 'processing' || content?.status === 'pending') {
        fetchContent();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [contentId, content?.status]);

  async function fetchContent() {
    const res = await fetch(`/api/content?contentId=${contentId}`);
    const data = await res.json();
    setContent(data.content);
    setLoading(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  }

  function renderOutput(output: Output) {
    const data = parseOutputData(output);

    switch (output.format) {
      case 'twitter_thread':
        return (
          <div className="space-y-4">
            {Array.isArray(data) && data.map((tweet: string, i: number) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="whitespace-pre-wrap">{tweet}</p>
                <button
                  onClick={() => copyToClipboard(tweet)}
                  className="mt-2 text-sm text-primary-500 hover:text-primary-600"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        );

      case 'linkedin_post':
      case 'newsletter':
      case 'seo_summary':
        return (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="whitespace-pre-wrap">{data.text || data}</p>
            <button
              onClick={() => copyToClipboard(data.text || data)}
              className="mt-4 text-sm text-primary-500 hover:text-primary-600"
            >
              Copy to clipboard
            </button>
          </div>
        );

      case 'tiktok_clip':
        return (
          <div className="space-y-4">
            {Array.isArray(data) && data.map((clip: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-lg mb-2">{clip.hook}</h4>
                <p className="text-sm text-gray-500 mb-2">
                  ⏱ {clip.timestamp?.start}s - {clip.timestamp?.end}s
                </p>
                <p className="whitespace-pre-wrap">{clip.script}</p>
              </div>
            ))}
          </div>
        );

      case 'quote_graphic':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(data) && data.map((quote: string, i: number) => (
              <div key={i} className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl">
                <p className="text-lg font-medium">"{quote}"</p>
                <button
                  onClick={() => copyToClipboard(quote)}
                  className="mt-4 text-sm text-white/80 hover:text-white"
                >
                  Copy quote
                </button>
              </div>
            ))}
          </div>
        );

      case 'instagram_caption':
        return (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="whitespace-pre-wrap mb-4">{data.caption}</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(data.hashtags) && data.hashtags.map((tag: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-sm">
                  #{tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => copyToClipboard(`${data.caption}\n\n${data.hashtags.map((t: string) => `#${t}`).join(' ')}`)}
              className="mt-4 text-sm text-primary-500 hover:text-primary-600"
            >
              Copy caption + hashtags
            </button>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Content not found</div>
      </div>
    );
  }

  const formatTabs = [
    { id: 'twitter_thread', label: 'Twitter Thread', icon: '🐦' },
    { id: 'linkedin_post', label: 'LinkedIn', icon: '💼' },
    { id: 'newsletter', label: 'Newsletter', icon: '📧' },
    { id: 'tiktok_clip', label: 'TikTok Clips', icon: '🎬' },
    { id: 'quote_graphic', label: 'Quotes', icon: '💬' },
    { id: 'seo_summary', label: 'SEO Summary', icon: '🔍' },
    { id: 'instagram_caption', label: 'Instagram', icon: '📸' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <h1 className="text-xl font-bold truncate">{content.title || 'Untitled'}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            content.status === 'completed' ? 'bg-green-100 text-green-800' :
            content.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {content.status}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        {(content.status === 'pending' || content.status === 'processing') && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⏳ Processing your content... This usually takes 30-60 seconds. Page will auto-refresh.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {formatTabs.map((tab) => {
            const hasOutput = content.outputs.some(o => o.format === tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!hasOutput}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : hasOutput
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* Output Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {(() => {
            const output = content.outputs.find(o => o.format === activeTab);
            if (!output) {
              return (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Output not available yet
                </p>
              );
            }
            return renderOutput(output);
          })()}
        </div>

        {/* Transcript */}
        {content.transcript && (
          <details className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <summary className="p-6 cursor-pointer font-medium">
              View Full Transcript
            </summary>
            <div className="px-6 pb-6">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
                {content.transcript}
              </p>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
