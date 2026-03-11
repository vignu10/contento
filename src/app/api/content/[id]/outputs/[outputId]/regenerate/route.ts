import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { generateMockOutputs } from '@/lib/mock-outputs';
import { regenerateOutputSchema } from '@/lib/validation';

// Mock AI regeneration - in production, this would call OpenAI with custom prompts
async function regenerateOutput(format: string, transcript: string, title: string, prompt?: string) {
  // Get the mock outputs and extract the format we need
  const allOutputs = generateMockOutputs(title);

  // Add prompt influence (simulated)
  let output = allOutputs[format as keyof typeof allOutputs];

  // If a custom prompt was provided, modify the output (simulated)
  if (prompt && typeof output === 'string') {
    output = `**Custom Regeneration**\n${output}\n\nBased on your request: "${prompt}"`;
  }

  return output;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; outputId: string }> }
) {
  const { id, outputId } = await params;

  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, tone, angle } = regenerateOutputSchema.parse(body);

    // Build enhanced prompt with tone and angle (reserved for future AI implementation)
    const enhancedPrompt = prompt ? `${prompt} (Tone: ${tone}, Angle: ${angle})` : undefined;

    // Verify ownership through content chain
    const output = await prisma.output.findUnique({
      where: { id: outputId },
      include: {
        content: {
          include: { _count: { select: { outputs: true } } }
        }
      },
    });

    if (!output || output.content.userId !== userId) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    // Verify the contentId matches the URL param
    if (output.contentId !== id) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Store the current output as editedData (to preserve history)
    const previousEditedData = output.editedData || output.data;

    // Regenerate the output with custom prompt
    const newData = await regenerateOutput(
      output.format,
      output.content.transcript || '',
      output.content.title || 'Untitled',
      enhancedPrompt
    );

    // Update the output
    const updatedOutput = await prisma.output.update({
      where: { id: outputId },
      data: {
        editedData: JSON.stringify(newData),
      },
    });

    return NextResponse.json({
      success: true,
      output: updatedOutput,
      previousData: previousEditedData,
    });
  } catch (error) {
    console.error('Error regenerating output:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate output' },
      { status: 500 }
    );
  }
}
