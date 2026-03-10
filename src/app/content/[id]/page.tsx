'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TikTokClip } from '@/services/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  Twitter,
  Linkedin,
  Mail,
  Video,
  Quote,
  FileText,
  Instagram,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw
} from 'lucide-react';

interface Output {
  id: string;
  format: string;
  data: string;
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
  createdAt: string;
}

interface ContentApiResponse {
  content: Content | null;
}

export default function ContentDetail() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('twitter_thread');
  const [copied, setCopied] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const fetchContent = useCallback(async () => {
    const res = await fetch(`/api/content?contentId=${contentId}`);
    const data = await res.json() as ContentApiResponse;
    setContent(data.content);
    setLoading(false);
  }, [contentId]);

  useEffect(() => {
    fetchContent();
    const interval = setInterval(() => {
      if (content?.status === 'processing' || content?.status === 'pending') {
        fetchContent();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [contentId, content?.status, fetchContent]);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleExport(format: 'json' | 'transcript') {
    setDownloading(true);
    try {
      const res = await fetch(`/api/content/${contentId}/export?format=${format}`);
      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const filename = content?.title?.replace(/[^a-z0-9]/gi, '-') || contentId;
      const date = new Date().toISOString().split('T')[0];

      a.download = `contento-${filename}-${date}.${format === 'json' ? 'json' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export successful', {
        description: `Your ${format === 'json' ? 'JSON' : 'transcript'} has been downloaded.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: 'An error occurred while exporting the content',
      });
    } finally {
      setDownloading(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/content/${contentId}/retry`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Retry failed');
      }

      await fetchContent();
      toast.success('Retry started', {
        description: 'Your content is being processed again.',
      });
    } catch (error) {
      console.error('Retry failed:', error);
      const err = error as Error;
      toast.error('Retry failed', {
        description: err.message || 'Failed to retry. Please try again later.',
      });
    } finally {
      setRetrying(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  }

  function CopyButton({ text, id }: { text: string; id: string }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(text, id)}
        className="h-8"
      >
        {copied === id ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </>
        )}
      </Button>
    );
  }

  function renderOutput(output: Output) {
    const data = parseOutputData(output);

    switch (output.format) {
      case 'twitter_thread':
        return (
          <div className="space-y-4">
            {Array.isArray(data) && data.map((tweet: string, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap mb-3">{tweet}</p>
                  <CopyButton text={tweet} id={`tweet-${i}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'linkedin_post':
        return (
          <Card>
            <CardContent className="p-4">
              <p className="whitespace-pre-wrap mb-4">{data.text || data}</p>
              <CopyButton text={data.text || data} id="linkedin" />
            </CardContent>
          </Card>
        );

      case 'newsletter':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{data.text || data}</p>
              </div>
              <Separator className="my-4" />
              <CopyButton text={data.text || data} id="newsletter" />
            </CardContent>
          </Card>
        );

      case 'tiktok_clip':
        return (
          <div className="space-y-4">
            {Array.isArray(data) && data.map((clip: TikTokClip, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-lg mb-2">{clip.hook}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Video className="h-3 w-3" />
                    {clip.timestamp?.start}s - {clip.timestamp?.end}s
                  </p>
                  <p className="whitespace-pre-wrap mb-3">{clip.script}</p>
                  <CopyButton text={clip.script} id={`clip-${i}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'quote_graphic':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(data) && data.map((quote: string, i: number) => (
              <Card key={i} className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0">
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-4">&ldquo;{quote}&rdquo;</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(quote, `quote-${i}`)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    {copied === `quote-${i}` ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'seo_summary':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{data.text || data}</p>
              </div>
              <Separator className="my-4" />
              <CopyButton text={data.text || data} id="seo" />
            </CardContent>
          </Card>
        );

      case 'instagram_caption':
        return (
          <Card>
            <CardContent className="p-4">
              <p className="whitespace-pre-wrap mb-4">{data.caption}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(data.hashtags) && data.hashtags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <CopyButton 
                text={`${data.caption}\n\n${data.hashtags.map((t: string) => `#${t}`).join(' ')}`} 
                id="instagram" 
              />
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="p-4">
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>
            </CardContent>
          </Card>
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Content not found</h2>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const formatTabs = [
    { id: 'twitter_thread', label: 'Twitter Thread', icon: Twitter },
    { id: 'linkedin_post', label: 'LinkedIn', icon: Linkedin },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'tiktok_clip', label: 'TikTok Clips', icon: Video },
    { id: 'quote_graphic', label: 'Quotes', icon: Quote },
    { id: 'seo_summary', label: 'SEO Summary', icon: FileText },
    { id: 'instagram_caption', label: 'Instagram', icon: Instagram },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold truncate max-w-md">
                  {content.title || 'Untitled'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {content.sourceType.toUpperCase()} • {new Date(content.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(content.status)}
              {content.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-950/50"
                >
                  {retrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </>
                  )}
                </Button>
              )}
              {content.status === 'completed' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('transcript')}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Transcript
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('json')}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {content.status === 'failed' && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Processing Failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      There was an error processing your content. This could be due to a network issue or API rate limit.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(content.status === 'pending' || content.status === 'processing') && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  Processing your content... This usually takes 30-60 seconds. Page will auto-refresh.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Output Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
            {formatTabs.map((tab) => {
              const hasOutput = content.outputs.some(o => o.format === tab.id);
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={!hasOutput}
                  className="flex items-center gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {formatTabs.map((tab) => {
            const output = content.outputs.find(o => o.format === tab.id);
            return (
              <TabsContent key={tab.id} value={tab.id}>
                {output ? (
                  renderOutput(output)
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-slate-500 dark:text-slate-400">
                        Output not available yet
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Transcript */}
        {content.transcript && (
          <Card className="mt-8">
            <CardHeader>
              <Button
                variant="ghost"
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full justify-between"
              >
                <CardTitle className="text-lg">Full Transcript</CardTitle>
                {showTranscript ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto">
                  {content.transcript}
                </p>
              </CardContent>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
