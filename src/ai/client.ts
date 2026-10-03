import type { Message, Mode, ConnectionInfo, Settings } from '../types';
import { getSystemPrompt } from './prompts';
import { generateReflectiveResponse } from './mock';

/**
 * Resolves the operational endpoint URL.
 * When useProxy is true, routes localhost:1234 requests through Vite's dev server proxy
 * to prevent browser CORS or mixed-content issues.
 */
export function resolveApiUrl(baseUrl: string, useProxy: boolean, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (useProxy && (cleanBase.includes('localhost:1234') || cleanBase.includes('127.0.0.1:1234'))) {
    // If baseUrl already ends with /v1, map to /api/lmstudio/v1/...
    if (cleanBase.endsWith('/v1')) {
      return `/api/lmstudio/v1${cleanPath}`;
    }
    return `/api/lmstudio${cleanPath}`;
  }

  // Direct connection
  return `${cleanBase}${cleanPath}`;
}

/**
 * Checks connection to LM Studio and discovers loaded models.
 */
export async function testLMStudioConnection(settings: Settings): Promise<ConnectionInfo> {
  const tryEndpoints = [
    resolveApiUrl(settings.baseUrl, settings.useProxy, '/models'),
    // Direct fallback if proxy fails or vice versa
    settings.baseUrl.replace(/\/+$/, '') + '/models'
  ];

  let lastError = '';

  for (const endpoint of tryEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models: string[] = Array.isArray(data?.data)
          ? data.data.map((m: { id?: string }) => m.id || '').filter(Boolean)
          : [];

        const isGemmaDetected = models.some((m) => m.toLowerCase().includes('gemma'));
        const activeModel = settings.model || models.find((m) => m.toLowerCase().includes('gemma')) || models[0] || '';

        return {
          status: 'connected',
          modelName: activeModel,
          endpoint: endpoint.includes('/api/lmstudio') ? 'LM Studio (Local Proxy)' : 'LM Studio (Direct)',
          availableModels: models,
          isGemmaDetected
        };
      } else {
        lastError = `LM Studio returned status ${res.status} (${res.statusText})`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('aborted')) {
        lastError = 'Connection timed out. Ensure LM Studio server is running.';
      } else {
        lastError = 'Unable to reach local LM Studio server at ' + settings.baseUrl;
      }
    }
  }

  return {
    status: 'offline',
    modelName: settings.model || 'Gemma (Offline)',
    endpoint: settings.baseUrl,
    availableModels: [],
    error: lastError || 'LM Studio server is not responding.'
  };
}

/**
 * Sends a conversation to LM Studio and receives the generated reflection.
 * Supports streaming via callback and falls back to regular completion if streaming is unavailable.
 */
export async function generateReflection(
  mode: Mode,
  messages: Message[],
  settings: Settings,
  onChunk?: (partial: string) => void
): Promise<string> {
  // If demoModeFallback is explicitly enabled or forced
  if (settings.demoModeFallback) {
    return generateReflectiveResponse(mode, messages, onChunk);
  }

  const systemPrompt = getSystemPrompt(mode);
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content
    }))
  ];

  const payload = {
    model: settings.model || 'gemma',
    messages: formattedMessages,
    temperature: settings.temperature ?? 0.7,
    stream: !!onChunk
  };

  const endpoint = resolveApiUrl(settings.baseUrl, settings.useProxy, '/chat/completions');

  try {
    const controller = new AbortController();
    // Allow up to 90 seconds for local CPU/GPU Gemma model generation
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': onChunk ? 'text/event-stream, application/json' : 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('LM Studio /v1/chat/completions endpoint not found. Please verify the base URL.');
      }
      const errText = await response.text().catch(() => '');
      throw new Error(`LM Studio error (${response.status}): ${errText || response.statusText}`);
    }

    // Handle Streaming response if stream reader is available
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  fullContent += delta;
                  onChunk(fullContent);
                }
              } catch {
                // Ignore chunk parse anomalies
              }
            }
          }
        }
      } catch (streamErr) {
        console.warn('Streaming interrupted, using accumulated content:', streamErr);
      }

      if (fullContent.trim()) {
        return fullContent;
      }
    }

    // Standard JSON completion fallback
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Received an empty response from the local Gemma model.');
    }

    if (onChunk) {
      onChunk(content);
    }
    return content;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // If LM Studio is not running and user allows fallback, we can use the gentle simulator with notice
    if (settings.demoModeFallback) {
      return generateReflectiveResponse(mode, messages, onChunk);
    }

    // Provide friendly, non-technical error
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('aborted') || errorMsg.includes('NetworkError')) {
      throw new Error(
        'Could not reach LM Studio. Please confirm that LM Studio is running with your Gemma model loaded and the local server started on port 1234.'
      );
    }

    throw new Error(errorMsg);
  }
}
