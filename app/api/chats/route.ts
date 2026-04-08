import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("id");

  if (!chatId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}