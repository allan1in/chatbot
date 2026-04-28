import { generateText, streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
    const { firstMessage, chatId } = await req.json();

    if (!firstMessage || !chatId) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const { text } = await generateText({
        model: openrouter.chat('bytedance-seed/seed-1.6-flash'),
        prompt: `你是一个专门生成聊天标题的 API 接口。请根据下方的用户消息，总结出一个15个字以内的聊天标题。严格遵守以下规则：1. 标题语言必须和用户消息完全一致。2. 绝对只输出标题本身！3. 不要包含任何解释、分析、确认语（如“好的”）、标点符号或引号。用户消息："${firstMessage}"`,
    });

    const title = text.trim();
    // 兜底：超过15字则截取前15字加...
    const safeTitle = title.length > 15 ? title.slice(0, 15) + '...' : title;

    // 入库
    await prisma.chat.upsert({
        where: { id: chatId },
        update: { updatedAt: new Date(), title: safeTitle },
        create: { id: chatId, title: safeTitle }
    });

    return NextResponse.json({ title: safeTitle });
}