import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { DEMAND_ENGINE_PROMPT } from './demand.prompt';

export interface DemandProfile {
  goals?: string[];
  lifestyle?: Record<string, unknown>;
  behavior_patterns?: Record<string, unknown>;
  resource_state?: Record<string, unknown>;
}

@Injectable()
export class DemandService {
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    this.anthropic = new Anthropic({ apiKey });
  }

  async evaluate(userInput: string, context: string, userProfile?: DemandProfile) {
    if (!this.anthropic.apiKey) {
      // Fallback to a mock or throw an error if no API key is provided
      console.warn('ANTHROPIC_API_KEY is not set. Returning fallback demand response.');
      return this.getFallbackResponse(userInput, context);
    }

    try {
      const payload = {
        user_input: userInput,
        context: context || '',
        user_profile: userProfile || {
          goals: [],
          lifestyle: {},
          behavior_patterns: {},
          resource_state: {}
        }
      };

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        temperature: 0.7,
        system: DEMAND_ENGINE_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Evaluate the following demand request:\n\n${JSON.stringify(payload, null, 2)}`
          }
        ],
      });

      const responseText = response.content.find(block => block.type === 'text');
      if (!responseText || responseText.type !== 'text') {
        throw new Error('Invalid response format from Anthropic API');
      }

      // Try to parse the output as JSON
      const jsonStr = responseText.text.trim();
      // Remove any potential markdown block wrappers just in case
      const cleanJsonStr = jsonStr.replace(/^```json/i, '').replace(/```$/, '').trim();
      
      const parsed = JSON.parse(cleanJsonStr);
      return parsed;

    } catch (error) {
      console.error('Error evaluating demand:', error);
      throw new InternalServerErrorException('Failed to process demand intelligence evaluation');
    }
  }

  private getFallbackResponse(userInput: string, context: string) {
    // Provide a reasonable fallback mimicking the frontend behavior if no API key is set
    return {
      decision: 'suggest_alternative',
      message: 'This is a reasonable direction. Based on your current path, you may benefit even more from these aligned options:',
      alternatives: [
        { type: 'better', title: 'Skill-Backed Version', description: 'Pursue this through a structured approach that builds a lasting capability alongside the outcome.' },
        { type: 'safer', title: 'Start Smaller', description: 'Begin with a lighter version of this demand to test alignment before committing fully.' },
        { type: 'growth', title: 'Community-Linked Option', description: 'Explore if this desire can be met while contributing to or learning from others around you.' }
      ],
      confidence_score: 0.76
    };
  }
}
