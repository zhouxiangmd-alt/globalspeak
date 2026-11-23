import type {
  AppSettings,
  ChatMessage,
  ScenarioConfig,
  SocialFeedbackReport,
} from '../types';
import {
  generateDemoFeedback,
  getDemoRoleplayReply,
  type RoleplayTurnOutput,
} from './mockAiEngine';
import { generateLlmFeedback, getLlmRoleplayReply } from './llmEngine';

export interface AiCallResult<T> {
  data: T;
  fallbackNotice?: string;
}

export function isRealAiConfigured(settings: AppSettings): boolean {
  if (settings.aiMode === 'gemini') return settings.geminiApiKey.trim().length > 0;
  if (settings.aiMode === 'openai') return settings.openaiApiKey.trim().length > 0;
  return false;
}

export async function requestRoleplayReply(
  settings: AppSettings,
  scenario: ScenarioConfig,
  messages: ChatMessage[],
  latestUserText: string,
  completedUserTurns: number
): Promise<AiCallResult<RoleplayTurnOutput>> {
  if (settings.aiMode !== 'demo' && isRealAiConfigured(settings)) {
    try {
      const data = await getLlmRoleplayReply(
        settings,
        scenario,
        messages,
        completedUserTurns
      );
      return { data };
    } catch (err) {
      const reason = err instanceof Error ? err.message : '接口连接异常';
      const fallback = await getDemoRoleplayReply(
        scenario,
        latestUserText,
        completedUserTurns
      );
      return {
        data: fallback,
        fallbackNotice: `真实模型暂时不可用（${reason}），已自动切换内置沙盒继续对练。`,
      };
    }
  }

  const data = await getDemoRoleplayReply(scenario, latestUserText, completedUserTurns);
  return { data };
}

export async function requestSocialFeedback(
  settings: AppSettings,
  scenario: ScenarioConfig,
  messages: ChatMessage[]
): Promise<AiCallResult<SocialFeedbackReport>> {
  if (settings.aiMode !== 'demo' && isRealAiConfigured(settings)) {
    try {
      const data = await generateLlmFeedback(settings, scenario, messages);
      return { data };
    } catch (err) {
      const reason = err instanceof Error ? err.message : '接口连接异常';
      const fallback = await generateDemoFeedback(scenario, messages);
      return {
        data: fallback,
        fallbackNotice: `实时分析请求失败（${reason}），已自动生成本地社交体检卡。`,
      };
    }
  }

  const data = await generateDemoFeedback(scenario, messages);
  return { data };
}
