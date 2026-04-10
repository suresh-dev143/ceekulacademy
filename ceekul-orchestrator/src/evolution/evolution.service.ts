import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvolutionService {
  private client: Anthropic;
  private readonly model = 'claude-3-5-sonnet-20240620';

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async evolveContent(contentId: string, context: { title: string; category: string; description: string; currentContent: string; cognitionScore: number; researchUpdates?: string }) {
    const system = `You are a content evolution agent for an adaptive learning platform.
Evaluate the current content based on learner cognition (score: ${context.cognitionScore}/100) and new research.
Produce a "Version 2.0" that improves clarity, immersive depth, and pedagogical accuracy.

Output ONLY valid JSON:
{
  "revisedContent": "string",
  "evolutionNotes": "string",
  "complexityLevel": "beginner|intermediate|advanced",
  "suggestedVisuals": ["string"]
}`;

    const userMessage = `Title: ${context.title} (${context.category})
Current Content: ${context.currentContent}
Research Updates: ${context.researchUpdates || 'None'}
Cognition Score: ${context.cognitionScore}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = (response.content[0] as any).text.trim();
      // Simple JSON extraction
      const cleanJson = text.replace(/^```(?:json)?\n?/,'').replace(/\n?```$/,'').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Content Evolution Error:', error);
      throw error;
    }
  }
}
