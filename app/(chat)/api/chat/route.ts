

import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// https://ai-sdk.dev/docs/reference/ai-sdk-ui/convert-to-model-messages#converttomodelmessages

// xiaomi/mimo-v2-flash:free (会输出思考内容)
// allenai/molmo-2-8b:free
// bytedance-seed/seed-1.6-flash
const modelName = "bytedance-seed/seed-1.6-flash";

// https://ai-sdk.dev/providers/community-providers/openrouter#examples
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter.chat(modelName),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
