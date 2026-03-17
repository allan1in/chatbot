

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});


export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // xiaomi/mimo-v2-flash:free (会输出思考内容)
    // allenai/molmo-2-8b:free
    // bytedance-seed/seed-1.6-flash
    model: openrouter.chat("bytedance-seed/seed-1.6-flash"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
