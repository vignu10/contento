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
  Edit2,
  X,
  Save
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
  const [editingOutput, setEditingOutput] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
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

  async function handleEdit(outputId: string, currentText: string) {
    setEditingOutput(outputId);
    setEditText(currentText);
  }

  async function handleSaveEdit(outputId: string) {
    setSaving(true);
    try {
      // The outputId in our editing format includes the format info
      // e.g., "actual-output-id-tweet-0" or "actual-output-id-caption"
      // We need to extract the actual output ID
      const actualOutputId = outputId.split('-').slice(0, -2).join('-') || outputId.replace(/-(tweet|clip|quote|caption|hook|script|hook|script)-?\d*$/, '');

      // Find the output being edited
      const output = content?.outputs.find(o => o.id.startsWith(actualOutputId) || outputId.startsWith(o.id));

      if (!output) {
        console.error('Output not found');
        return;
      }

      // Parse existing data
      const existingData = parseOutputData(output);
      let editedData: string;

      // Construct the edited data based on format
      switch (output.format) {
        case 'twitter_thread':
          // outputId format: "outputId-tweet-index"
          const tweetIndex = parseInt(outputId.split('-').pop() || '0');
          const tweets = [...(Array.isArray(existingData) ? existingData : [])];
          tweets[tweetIndex] = editText;
          editedData = JSON.stringify(tweets);
          break;

        case 'tiktok_clip':
          // outputId format: "outputId-clip-index-hook" or "outputId-clip-index-script"
          const parts = outputId.split('-');
          const clipIdx = parseInt(parts[parts.length - 2]);
          const field = parts[parts.length - 1]; // 'hook' or 'script'
          const clips = [...(Array.isArray(existingData) ? existingData : [])];
          if (clips[clipIdx]) {
            clips[clipIdx] = { ...clips[clipIdx], [field]: editText };
          }
          editedData = JSON.stringify(clips);
          break;

        case 'quote_graphic':
          // outputId format: "outputId-quote-index"
          const quoteIdx = parseInt(outputId.split('-').pop() || '0');
          const quotes = [...(Array.isArray(existingData) ? existingData : [])];
          quotes[quoteIdx] = editText;
          editedData = JSON.stringify(quotes);
          break;

        case 'instagram_caption':
          // For caption editing
          const instagramData = existingData as { caption: string; hashtags: string[] };
          editedData = JSON.stringify({
            ...instagramData,
            caption: editText,
          });
          break;

        default:
          // For simple text outputs (LinkedIn, newsletter, SEO summary)
          editedData = JSON.stringify({ text: editText });
      }

      const res = await fetch(`/api/content/${contentId}/outputs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputId: actualOutputId,
          editedData,
        }),
      });

      if (res.ok) {
        setEditingOutput(null);
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to save edit:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingOutput(null);
    setEditText('');
  }

  async function handleRevert(outputId: string) {
    // Extract actual output ID
    const actualOutputId = outputId.split('-').slice(0, -2).join('-') || outputId.replace(/-(tweet|clip|quote|caption|hook|script|hook|script)-?\d*$/, '');

    // Find the output
    const output = content?.outputs.find(o => o.id.startsWith(actualOutputId) || outputId.startsWith(o.id));

    if (!output) {
      return;
    }

    // Clear editedData by setting it to null
    try {
      const res = await fetch(`/api/content/${contentId}/outputs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outputId: actualOutputId,
          editedData: null,
        }),
      });

      if (res.ok) {
        setEditingOutput(null);
        fetchContent();
      }
    } catch (error) {
      console.error('Failed to revert:', error);
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

  function EditableText({ text, outputId, isMultiline = false }: { text: string; outputId: string; isMultiline?: boolean }) {
    const isEditing = editingOutput === outputId;

    if (isEditing) {
      return (
        <div className="space-y-2">
          {isMultiline ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[200px] p-3 border rounded-lg bg-background"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSaveEdit(outputId)}
              disabled={saving}
              className="h-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={saving}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap">{text}</div>
    );
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
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 mb-1 block">Tweet {i + 1}</span>
                    <EditableText
                      text={tweet}
                      outputId={`${output.id}-tweet-${i}`}
                      isMultiline={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingOutput !== `${output.id}-tweet-${i}` && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(`${output.id}-tweet-${i}`, tweet)}
                        className="h-8"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <CopyButton text={tweet} id={`tweet-${i}`} />
                    {output.editedData && editingOutput !== `${output.id}-tweet-${i}` && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevert(`${output.id}-tweet-${i}`)}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Revert
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'linkedin_post':
        return (
          <Card>
            <CardContent className="p-4">
              <EditableText
                text={data.text || data}
                outputId={output.id}
                isMultiline={true}
              />
              <Separator className="my-3" />
              <div className="flex gap-2">
                {editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(output.id, data.text || data)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                <CopyButton text={data.text || data} id="linkedin" />
                {output.editedData && editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevert(output.id)}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'newsletter':
        return (
          <Card>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <EditableText
                  text={data.text || data}
                  outputId={output.id}
                  isMultiline={true}
                />
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                {editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(output.id, data.text || data)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                <CopyButton text={data.text || data} id="newsletter" />
                {output.editedData && editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevert(output.id)}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'tiktok_clip':
        return (
          <div className="space-y-4">
            {Array.isArray(data) && data.map((clip: TikTokClip, i: number) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-slate-500 mb-1 block">Hook</span>
                    <EditableText
                      text={clip.hook}
                      outputId={`${output.id}-clip-${i}-hook`}
                      isMultiline={false}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Video className="h-3 w-3" />
                    {clip.timestamp?.start}s - {clip.timestamp?.end}s
                  </p>
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 mb-1 block">Script</span>
                    <EditableText
                      text={clip.script}
                      outputId={`${output.id}-clip-${i}-script`}
                      isMultiline={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingOutput !== `${output.id}-clip-${i}-hook` && editingOutput !== `${output.id}-clip-${i}-script` && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(`${output.id}-clip-${i}-hook`, clip.hook)}
                        className="h-8"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <CopyButton text={clip.script} id={`clip-${i}`} />
                    {output.editedData && editingOutput !== `${output.id}-clip-${i}-hook` && editingOutput !== `${output.id}-clip-${i}-script` && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevert(`${output.id}-clip-${i}-hook`)}
                        className="h-8"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Revert
                      </Button>
                    )}
                  </div>
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
                  {editingOutput === `${output.id}-quote-${i}` ? (
                    <div className="space-y-2 mb-4">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[100px] p-2 rounded-lg bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(`${output.id}-quote-${i}`)}
                          disabled={saving}
                          className="h-8 bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="h-8 bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-4">&ldquo;{quote}&rdquo;</p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(`${output.id}-quote-${i}`, quote)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
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
                        {output.editedData && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRevert(`${output.id}-quote-${i}`)}
                            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </>
                  )}
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
                <EditableText
                  text={data.text || data}
                  outputId={output.id}
                  isMultiline={true}
                />
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                {editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(output.id, data.text || data)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                <CopyButton text={data.text || data} id="seo" />
                {output.editedData && editingOutput !== output.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevert(output.id)}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'instagram_caption':
        return (
          <Card>
            <CardContent className="p-4">
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Caption</label>
                <EditableText
                  text={data.caption}
                  outputId={`${output.id}-caption`}
                  isMultiline={true}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.isArray(data.hashtags) && data.hashtags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                {editingOutput !== `${output.id}-caption` && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(`${output.id}-caption`, data.caption)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit Caption
                  </Button>
                )}
                <CopyButton
                  text={`${data.caption}\n\n${data.hashtags.map((t: string) => `#${t}`).join(' ')}`}
                  id="instagram"
                />
                {output.editedData && editingOutput !== `${output.id}-caption` && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevert(`${output.id}-caption`)}
                    className="h-8"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Revert
                  </Button>
                )}
              </div>
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
