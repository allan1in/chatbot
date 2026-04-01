import { ToggleCopy } from "./toggle-copy";
import { ReactNode } from "react";

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
type ParagraphProps = React.HTMLAttributes<HTMLParagraphElement>;
type ListProps = React.HTMLAttributes<HTMLUListElement | HTMLOListElement>;
type ListItemProps = React.HTMLAttributes<HTMLLIElement>;

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
}

interface PreProps {
  children?: ReactNode;
}

export const markdownComponents = {
  h1: (props: HeadingProps) => <h1 className="text-2xl font-bold tracking-tight mt-8 mb-4 pb-2" {...props} />,
  h2: (props: HeadingProps) => <h2 className="text-xl font-semibold tracking-tight mt-6 mb-3" {...props} />,
  h3: (props: HeadingProps) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
  p: (props: ParagraphProps) => <p className="mb-4 last:mb-0 leading-7" {...props} />,
  ul: (props: ListProps) => <ul className="list-disc ml-6 mb-4 space-y-1.5" {...props} />,
  ol: (props: ListProps) => <ol className="list-decimal ml-6 mb-4 space-y-1.5" {...props} />,
  li: (props: ListItemProps) => <li className="pl-1" {...props} />,
  pre: ({ children }: PreProps) => <>{children}</>,
  code: ({ inline, children, className, ...props }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');

    return !inline && match ? (
      <div className="group relative my-6 rounded-xl overflow-hidden border border-border  bg-muted">
        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {match[1]}
            </span>
          </div>
          <ToggleCopy 
            content={codeString}
            iconA="copy" 
            iconB="check" 
            className="flex items-center"
            autoResetDelay={3000}
          />
        </div>
        
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin" {...props}>
          <code>{codeString}</code>
        </pre>
      </div>
    ) : (
      <code className="bg-muted px-1.5 py-0.5 mx-1.5 rounded text-[0.85em] font-mono font-medium border border-border/40" {...props}>
        {children}
      </code>
    );
  },
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-primary/20 bg-muted/40 px-4 py-2 italic my-6 rounded-r-lg text-muted-foreground" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-primary font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all" {...props} />
  ),
};
