'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Edit,
  Save,
  X,
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
  ChevronUp
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
  const [editingOutput, setEditingOutput] = useState<{ id: string; data: string } | null>(null);
  const [saving, setSaving] = useState(false);

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

  async function handleSaveEdit() {
    if (!editingOutput) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/content/${contentId}/outputs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputId: editingOutput.id,
          editedData: editingOutput.data,
        }),
      });

      if (res.ok) {
        setEditingOutput(null);
        await fetchContent(); // Refresh to show edited content
      }
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('Failed to save edit. Please try again.');
    } finally {
      setSaving(false);
    }
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
              {editingOutput?.id === output.id ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full min-h-[200px] p-3 border rounded-md"
                    value={editingOutput.data}
                    onChange={(e) => setEditingOutput({ ...editingOutput, data: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingOutput(null)}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap mb-4">{data.text || data}</p>
                  <div className="flex gap-2">
                    <CopyButton text={data.text || data} id="linkedin" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOutput({ id: output.id, data: output.editedData || output.data })}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case 'newsletter':
        return (
          <Card>
            <CardContent className="p-6">
              {editingOutput?.id === output.id ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full min-h-[300px] p-3 border rounded-md"
                    value={editingOutput.data}
                    onChange={(e) => setEditingOutput({ ...editingOutput, data: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingOutput(null)}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{data.text || data}</p>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <CopyButton text={data.text || data} id="newsletter" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOutput({ id: output.id, data: output.editedData || output.data })}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </>
              )}
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
              {editingOutput?.id === output.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Caption</label>
                    <textarea
                      className="w-full min-h-[150px] p-3 border rounded-md"
                      value={editingOutput.data}
                      onChange={(e) => setEditingOutput({ ...editingOutput, data: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                      {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingOutput(null)}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap mb-4">{data.caption}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(data.hashtags) && data.hashtags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <CopyButton 
                      text={`${data.caption}\n\n${data.hashtags.map((t: string) => `#${t}`).join(' ')}`} 
                      id="instagram" 
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOutput({ id: output.id, data: output.editedData || output.data })}
                      className="h-8"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </>
              )}
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
            {getStatusBadge(content.status)}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
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
