// Mock outputs generator for regeneration
// In production, this would use OpenAI API with custom prompts

export function generateMockOutputs(title: string) {
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
    linkedinPost: `I just watched "${title}" and wow...\n\nThe insights were incredible.\n\nHere's what stood out:\n\n→ The framework they shared is game-changing\n→ Real examples from real practitioners\n→ Actionable steps you can implement today\n\nIf you're in this space, this is a must-watch.\n\nWhat's best content you've consumed recently?\n\n#content #learning #growth`,
    newsletter: `# ${title}\n\n## Summary\n\nThis piece covers essential insights that every creator should know.\n\n## Key Takeaways\n\n1. **First Point** - Explanation of first major insight\n2. **Second Point** - Why this matters for your work\n3. **Third Point** - How to implement this immediately\n\n## Action Items\n\n- [ ] Review your current approach\n- [ ] Implement one change this week\n- [ ] Track your results\n\n## Final Thoughts\n\nThe difference between good and great is often in the details. This content highlights exactly those nuances.\n\n---\n*Thanks for reading! Reply with your thoughts.*`,
    tiktokClips: [
      {
        hook: "This changed everything about how I create content...",
        timestamp: { start: 0, end: 45 },
        script: "POV: You just discovered to secret to viral content\n\n[Hook plays]\n\nMost people think it's about luck.\n\nBut here's what actually works..."
      },
      {
        hook: "Nobody talks about this, but it's key to growth",
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
      "Your content is only as good as value it provides.",
      "Focus on impact, not impressions.",
      "Every expert was once a beginner."
    ],
    seoSummary: `# ${title}\n\nThis comprehensive guide explores essential strategies and frameworks that content creators need to succeed in today's digital landscape.\n\n## What You'll Learn\n\nThe content covers multiple aspects of content creation, from initial ideation to distribution strategies. Key areas include:\n\n- **Content Strategy**: How to plan and execute a content calendar that resonates with your audience\n- **Audience Engagement**: Techniques for building and maintaining an engaged community\n- **Platform Optimization**: Best practices for each major social platform\n\n## Why This Matters\n\nIn an increasingly crowded digital space, standing out requires more than just good content. It requires strategic thinking, consistent execution, and deep understanding of your audience.\n\n## Key Takeaways\n\n1. Consistency beats perfection\n2. Value-driven content outperforms promotional content\n3. Community building is to foundation of long-term success`,
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
