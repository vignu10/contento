'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Youtube,
  Mic,
  FileText,
  Zap,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Subtle background texture - not a pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-5xl mx-auto">
          {/* ==========================================================================
              HERO SECTION - Asymmetric layout, left-aligned, distinctive typography
              ========================================================================== */}
          <div className="mb-12 lg:mb-16">
            {/* Logo mark - simple, not in a container */}
            <div className="mb-8">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary">
                Contento
              </h1>
            </div>

            {/* Left-aligned tagline with visual interest */}
            <div className="max-w-2xl">
              <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed mb-6">
                Transform one piece of content into{' '}
                <span className="text-accent font-semibold">
                  10+ formats
                </span>{' '}
                for all platforms.
              </p>
              <p className="text-text-tertiary">
                YouTube videos, podcasts, blogs → Twitter threads, LinkedIn posts, newsletters, TikTok scripts, and more.
              </p>
            </div>

            {/* Supported formats - inline pills, not centered */}
            <div className="flex flex-wrap gap-2 mt-8">
              {[
                { icon: Youtube, label: 'YouTube' },
                { icon: Mic, label: 'Podcasts' },
                { icon: FileText, label: 'Blogs & PDFs' },
              ].map((format) => (
                <div
                  key={format.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border"
                >
                  <format.icon className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm text-text-secondary">{format.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ==========================================================================
              TWO-COLUMN LAYOUT - Auth form left, key benefits right
              Asymmetric spacing for visual interest
              ========================================================================== */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Auth Form - 7 columns */}
            <div className="lg:col-span-7">
              <Card className="border border-border-strong shadow-lg">
                <CardHeader className="pb-4">
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
                        <div className="text-sm text-error bg-error/10 p-3 rounded-md border border-error/20">
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
                        ) : (
                          <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Key Benefits - 5 columns, styled list not cards */}
            <div className="lg:col-span-5 lg:pt-2">
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text-primary">Why Contento?</h2>
                <ul className="space-y-4">
                  {[
                    {
                      icon: Zap,
                      title: 'Lightning Fast',
                      description: 'Transform content in seconds, not hours',
                    },
                    {
                      icon: FileText,
                      title: '10+ Formats',
                      description: 'Twitter, LinkedIn, Newsletter, TikTok, and more',
                    },
                  ].map((benefit) => (
                    <li key={benefit.title} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <benefit.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary mb-0.5">{benefit.title}</h3>
                        <p className="text-sm text-text-secondary">{benefit.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-sm text-text-tertiary">
            Built by Izanagi for Vignu
          </div>
        </div>
      </main>
    </div>
  );
}
