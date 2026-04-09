import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

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
  const { message, chatId }: { message: string, chatId?: string } = await req.json();

  if (!chatId || !message) {
    return NextResponse.json({ error: "Missing chatId or message" }, { status: 400 });
  }

  try {
    const { text } = await generateText({
      model: openrouter.chat(modelName),
      prompt: `请为以下用户的提问生成一个简短的标题（不要标点符号，不超过20个字）：\n\n"${message}"`,
    });

    const title = text.trim().replace(/["'“”]/g, '');

    await prisma.chat.upsert({
      where: { id: chatId },
      update: {
        title: title, 
        updatedAt: new Date() 
      },
      create: {
        id: chatId,
        title: title,
      }
    });

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error saving chat title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
