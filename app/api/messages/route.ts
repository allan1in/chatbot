import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

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
  const { messages, chatId }: { messages: UIMessage[], chatId?: string } = await req.json();

  const lastUserMessage = messages[messages.length - 1];

  // 拼接用户消息内容
  const userContent = lastUserMessage?.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n') || '';

  const result = streamText({
    model: openrouter.chat(modelName),
    messages: await convertToModelMessages(messages),
    // 这里的 onFinish 回调会在模型完成生成后被调用，我们可以在这里进行数据库的保存操作
    async onFinish({ text }) {
      if (chatId && lastUserMessage?.role === 'user' && userContent) {
        try {
          await prisma.chat.upsert({
            where: { id: chatId },
            update: { updatedAt: new Date() },
            create: {
              id: chatId,
              title: userContent.slice(0, 15), 
            }
          });

          // 使用事务确保两条消息要么同时成功，要么同时失败
          await prisma.$transaction([
            // 保存用户消息
            prisma.message.create({
              data: {
                chatId: chatId,
                role: 'user',
                content: userContent,
              }
            }),
            // 保存 ai 消息
            prisma.message.create({
              data: {
                chatId: chatId,
                role: 'assistant',
                content: text,
              }
            })
          ]);

        } catch (error) {
          console.error('Error saving chat:', error);
        }
      }
    }
  });

  return result.toUIMessageStreamResponse();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("id");

  if (!chatId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        title: true,
        messages: {
          orderBy: { createdAt: "asc" }, // 保证对话顺序正确
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ title: "新对话", messages: [] });
    }

    return NextResponse.json({ title: chat.title, messages: chat.messages });
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}