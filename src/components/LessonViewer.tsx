import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LessonViewerProps {
  title: string;
  duration?: string;
  videoUrl?: string;
  markdown?: string;
  completed?: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * Frutiger Aero lesson viewer.
 * - Clean embedded video player (16:9, no controls overlap)
 * - Markdown body with GFM (tables, lists, code)
 * - Glassy panel matching the design system
 */
export function LessonViewer({
  title,
  duration,
  videoUrl,
  markdown,
  completed,
  onClose,
  children,
}: LessonViewerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10",
        "bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent",
        "backdrop-blur-xl shadow-[0_8px_32px_rgba(0,240,255,0.08)]"
      )}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Play className="h-4 w-4 text-primary shrink-0" />
          <h3 className="truncate text-sm font-semibold tracking-wide">{title}</h3>
          {duration && (
            <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
              {duration}
            </span>
          )}
          {completed && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Concluído
            </span>
          )}
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          <X className="h-3 w-3 mr-1" /> Fechar
        </Button>
      </div>

      <div className="space-y-5 p-5">
        {/* Video */}
        {videoUrl && (
          <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
            <iframe
              src={videoUrl}
              title={title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Markdown body */}
        {markdown && (
          <article
            className={cn(
              "prose prose-invert prose-sm max-w-none",
              "prose-headings:font-semibold prose-headings:tracking-tight",
              "prose-h1:text-xl prose-h2:text-base prose-h3:text-sm",
              "prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed",
              "prose-strong:text-foreground",
              "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
              "prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-cyan-300 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none",
              "prose-pre:rounded-lg prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/40 prose-pre:text-xs",
              "prose-ul:text-sm prose-li:marker:text-primary",
              "prose-blockquote:border-l-primary/60 prose-blockquote:text-muted-foreground"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        )}

        {children}
      </div>
    </div>
  );
}
