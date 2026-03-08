'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Youtube,
  Upload,
  FileText,
  Loader2,
  LogOut,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';

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
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth');
    const data = await res.json();
    if (!data.user) {
      router.push('/');
      return;
    }
    setUser(data.user);
  }, [router]);

  const fetchContents = useCallback(async () => {
    const res = await fetch('/api/content');
    const data = await res.json();
    setContents(data.contents || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
    fetchContents();
  }, [fetchUser, fetchContents]);

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

  async function handleFileUpload(file: File, sourceType: string) {
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', sourceType);
      formData.append('userId', user?.id || '');

      const res = await fetch('/api/content', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchContents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Failed to upload file');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Contento
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI Content Repurposing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">
              {user?.name || user?.email}
            </span>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Transform Your Content</h2>
          <p className="text-slate-600 dark:text-slate-400">
            One piece of content → 10+ formats for all platforms
          </p>
        </div>

        {/* New Content Section */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Process New Content
            </CardTitle>
            <CardDescription>
              Upload a file or paste a YouTube URL to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="youtube" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube URL
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube">
                <form onSubmit={handleYoutubeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="youtube-url"
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="flex-1"
                        disabled={processing}
                      />
                      <Button type="submit" disabled={processing || !youtubeUrl.trim()}>
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Process
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="file">
                <FileUpload onUpload={handleFileUpload} processing={processing} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Content History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Your Content
            </CardTitle>
            <CardDescription>
              {contents.length === 0 
                ? "No content processed yet. Start by uploading or pasting a URL above!"
                : `${contents.length} piece${contents.length !== 1 ? 's' : ''} of content processed`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contents.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  No content processed yet
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Upload a file or paste a YouTube URL to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contents.map((content) => (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-all hover:border-violet-300 dark:hover:border-violet-700 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate mb-1">
                              {content.title || 'Untitled'}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                {content.sourceType === 'youtube' ? (
                                  <Youtube className="h-3 w-3" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                                {content.sourceType.toUpperCase()}
                              </span>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(content.createdAt).toLocaleDateString()}
                              </span>
                              {content._count?.outputs && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <span>{content._count.outputs} outputs</span>
                                </>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(content.status)}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
