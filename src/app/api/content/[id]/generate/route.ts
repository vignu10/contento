import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { getUserId } from '@/lib/auth';

// Mock outputs for demo (in production, this comes from AI processing)
function generateMockOutputs(title: string) {
  return {
    twitterThread: [
      `🧵 Just dropped: "${title}"`,
      "Here's what I learned from this...",
      "1. The key insight that changed everything",
      "2. Why most people get this wrong",
      "3. The simple fix that works every time",
      "4. Real results from real people",
      "5. How you can apply this today",
      "Thread 🧵👇"
    ],
    linkedinPost: `I just watched "${title}" and wow...\n\nThe insights were incredible.\n\nHere's what stood out:\n\n→ The framework they shared is game-changing\n→ Real examples from real practitioners\n→ Actionable steps you can implement today\n\nIf you're in this space, this is a must-watch.\n\nWhat's the best content you've consumed recently?\n\n#content #learning #growth`,
    newsletter: `# ${title}\n\n## Summary\n\nThis piece covers essential insights that every creator should know.\n\n## Key Takeaways\n\n1. **First Point** - Explanation of the first major insight\n2. **Second Point** - Why this matters for your work\n3. **Third Point** - How to implement this immediately\n\n## Action Items\n\n- [ ] Review your current approach\n- [ ] Implement one change this week\n- [ ] Track your results\n\n## Final Thoughts\n\nThe difference between good and great is often in the details. This content highlights exactly those nuances.\n\n---\n*Thanks for reading! Reply with your thoughts.*`,
    tiktokClips: [
      {
        hook: "This changed everything about how I create content...",
        timestamp: { start: 0, end: 45 },
        script: "POV: You just discovered the secret to viral content\n\n[Hook plays]\n\nMost people think it's about luck.\n\nBut here's what actually works..."
      },
      {
        hook: "Nobody talks about this, but it's the key to growth",
        timestamp: { start: 120, end: 180 },
        script: "The algorithm isn't your enemy.\n\nHere's how to work WITH it..."
      },
      {
        hook: "I wish I knew this when I started",
        timestamp: { start: 300, end: 360 },
        script: "3 years of mistakes summed up in 60 seconds.\n\nSave this for later..."
      }
    ],
    quoteGraphics: [
      "Success is not about being the best. It's about being consistent.",
      "The best time to start was yesterday. The second best time is now.",
      "Your content is only as good as the value it provides.",
      "Focus on impact, not impressions.",
      "Every expert was once a beginner."
    ],
    seoSummary: `# ${title}\n\nThis comprehensive guide explores the essential strategies and frameworks that content creators need to succeed in today's digital landscape.\n\n## What You'll Learn\n\nThe content covers multiple aspects of content creation, from initial ideation to distribution strategies. Key areas include:\n\n- **Content Strategy**: How to plan and execute a content calendar that resonates with your audience\n- **Audience Engagement**: Techniques for building and maintaining an engaged community\n- **Platform Optimization**: Best practices for each major social platform\n\n## Why This Matters\n\nIn an increasingly crowded digital space, standing out requires more than just good content. It requires strategic thinking, consistent execution, and deep understanding of your audience.\n\n## Key Takeaways\n\n1. Consistency beats perfection\n2. Value-driven content outperforms promotional content\n3. Community building is the foundation of long-term success`,
    instagramCaption: `Just dropped something game-changing 🔥\n\n"${title}" is live and it's packed with value.\n\nSwipe through to see:\n→ The framework\n→ Real examples\n→ Action items\n\nSave this for later and share with someone who needs it 🙌\n\nDrop a 🔥 if you want more content like this`,
    hashtags: [
      "contentcreator",
      "contentmarketing",
      "socialmediatips",
      "growthhacking",
      "digitalmarketing",
      "contentstrategy",
      "creatorconomy",
      "socialmediamarketing",
      "onlinebusiness",
      "entrepreneur",
      "marketingtips",
      "contenttips",
      "growyourbrand",
      "brandstrategy",
      "businesstips"
    ]
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Enforce ownership
    const content = await prisma.content.findFirst({
      where: { id: params.id, userId },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Generate mock outputs (in production, this would call AI)
    const outputs = generateMockOutputs(content.title || 'Untitled Content');

    // Delete existing outputs
    await prisma.output.deleteMany({
      where: { contentId: params.id },
    });

    // Create new outputs
    const outputPromises = [
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'twitter_thread',
          data: JSON.stringify(outputs.twitterThread),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'linkedin_post',
          data: JSON.stringify({ text: outputs.linkedinPost }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'newsletter',
          data: JSON.stringify({ text: outputs.newsletter }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'tiktok_clip',
          data: JSON.stringify(outputs.tiktokClips),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'quote_graphic',
          data: JSON.stringify(outputs.quoteGraphics),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'seo_summary',
          data: JSON.stringify({ text: outputs.seoSummary }),
        },
      }),
      prisma.output.create({
        data: {
          contentId: params.id,
          format: 'instagram_caption',
          data: JSON.stringify({ 
            caption: outputs.instagramCaption,
            hashtags: outputs.hashtags,
          }),
        },
      }),
    ];

    await Promise.all(outputPromises);

    // Update content status
    await prisma.content.update({
      where: { id: params.id },
      data: {
        status: 'completed',
        processedAt: new Date(),
        transcript: `[Mock transcript for: ${content.title}]\n\nThis is a placeholder transcript. In production, this would be the actual transcribed text from the audio/video content using OpenAI Whisper.`,
      },
    });

    return NextResponse.json({ success: true, outputsGenerated: 7 });
  } catch (error) {
    console.error('Error generating outputs:', error);
    return NextResponse.json(
      { error: 'Failed to generate outputs' },
      { status: 500 }
    );
  }
}
