import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  workspace: { findUnique: jest.fn() },
  agentConversation: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  agentMessage: { create: jest.fn(), findMany: jest.fn() }
};

const mockAiService = {
  generateStructuredOutput: jest.fn()
};

const mockAnalyticsService = {
  getOverview: jest.fn()
};

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    jest.clearAllMocks();
  });

  it('runs tool execution loop and bounds at 5 max steps', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-1', type: 'marketing' });
    mockPrisma.agentConversation.create.mockResolvedValueOnce({ id: 'conv-1' });
    mockPrisma.agentMessage.findMany.mockResolvedValue([]);
    
    // Always return a toolCall to force loop maxing out
    mockAiService.generateStructuredOutput.mockResolvedValue({
      thought: 'Need data',
      toolCall: { name: 'getAnalyticsOverview', args: {} }
    });

    const res = await service.chat('ws-1', 'Why did traffic drop?');
    
    expect(res.answer).toContain('maximum allowed thinking steps');
    expect(mockAiService.generateStructuredOutput).toHaveBeenCalledTimes(5);
  });

  it('enforces medical safety in prompt', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-med', type: 'medical' });
    mockPrisma.agentConversation.create.mockResolvedValueOnce({ id: 'conv-2' });
    mockPrisma.agentMessage.findMany.mockResolvedValue([]);

    mockAiService.generateStructuredOutput.mockResolvedValueOnce({
      thought: 'Done',
      finalAnswer: { text: 'Everything is fine.', suggestedActions: [], sources: [] }
    });

    await service.chat('ws-med', 'How is my traffic?');
    
    const prompt = mockAiService.generateStructuredOutput.mock.calls[0][0];
    expect(prompt).toContain('MEDICAL SAFETY RULES');
    expect(prompt).toContain('Do NOT diagnose patients');
  });

  it('stops early when finalAnswer is provided', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({ id: 'ws-1', type: 'marketing' });
    mockPrisma.agentConversation.create.mockResolvedValueOnce({ id: 'conv-3' });
    mockPrisma.agentMessage.findMany.mockResolvedValue([]);

    mockAiService.generateStructuredOutput.mockResolvedValueOnce({
      thought: 'Done',
      finalAnswer: { text: 'Your traffic is up 10%.', suggestedActions: ['Keep going'], sources: ['Google Search Console'] }
    });

    const res = await service.chat('ws-1', 'How is my traffic?');
    expect(res.answer).toBe('Your traffic is up 10%.');
    expect(res.suggestedActions).toEqual(['Keep going']);
    expect(res.sources).toEqual(['Google Search Console']);
    expect(mockAiService.generateStructuredOutput).toHaveBeenCalledTimes(1);
  });

  it('throws if workspace invalid', async () => {
    mockPrisma.workspace.findUnique.mockResolvedValueOnce(null);
    await expect(service.chat('ws-invalid', 'Hello')).rejects.toThrow(NotFoundException);
  });
});
