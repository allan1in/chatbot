"use client";

export function Navbar() {
  return (
    <nav
      className="fixed top-0 right-0 bg-background w-full h-14 flex items-center justify-between"
    >
        <span className="font-semibold text-foreground px-4">Chatbot</span>
        <div className="font-semibold text-foreground px-4">TODO</div>
    </nav>
  );
}
