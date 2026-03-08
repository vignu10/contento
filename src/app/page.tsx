'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Youtube, 
  Mic, 
  FileText, 
  ArrowRight,
  Zap,
  Layers,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          router.push('/dashboard');
        }
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'signup',
          email,
          password,
          name: isLogin ? undefined : name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: Youtube,
      title: 'YouTube Videos',
      description: 'Paste any YouTube URL'
    },
    {
      icon: Mic,
      title: 'Podcasts',
      description: 'Upload audio files'
    },
    {
      icon: FileText,
      title: 'Blogs & PDFs',
      description: 'Any text content'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Transform content in seconds, not hours'
    },
    {
      icon: Layers,
      title: '10+ Formats',
      description: 'Twitter, LinkedIn, Newsletter, TikTok, and more'
    },
    {
      icon: TrendingUp,
      title: 'Maximize Reach',
      description: 'One piece of content, maximum distribution'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-6 shadow-xl shadow-violet-500/25">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Contento
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Transform one piece of content into{' '}
              <span className="font-semibold text-violet-600 dark:text-violet-400">
                10+ formats
              </span>{' '}
              for all platforms
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <feature.icon className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Auth Card */}
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Create an account or sign in to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" onValueChange={(v) => setIsLogin(v === 'login')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required={!isLogin}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>

                    {error && (
                      <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? (
                        'Please wait...'
                      ) : isLogin ? (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Tabs>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950 dark:to-indigo-950 flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Built by Izanagi for Vignu 🎯</p>
          </div>
        </div>
      </div>
    </div>
  );
}
