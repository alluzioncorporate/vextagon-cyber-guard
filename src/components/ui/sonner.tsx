import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 text-foreground shadow-[0_8px_32px_rgba(0,240,255,0.15)] backdrop-blur-2xl backdrop-saturate-150 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-300/60 before:to-transparent after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-white/10 after:to-transparent after:pointer-events-none",
          title: "relative z-10 text-sm font-semibold tracking-wide",
          description: "relative z-10 text-xs text-muted-foreground/90",
          actionButton:
            "relative z-10 rounded-md bg-primary/80 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur hover:bg-primary",
          cancelButton:
            "relative z-10 rounded-md bg-white/10 px-3 py-1 text-xs text-muted-foreground hover:bg-white/20",
          success:
            "border-emerald-400/30 shadow-[0_8px_32px_rgba(16,185,129,0.25)] before:via-emerald-300/60",
          error:
            "border-red-400/30 shadow-[0_8px_32px_rgba(239,68,68,0.25)] before:via-red-300/60",
          warning:
            "border-amber-400/30 shadow-[0_8px_32px_rgba(245,158,11,0.25)] before:via-amber-300/60",
          info:
            "border-cyan-400/30 shadow-[0_8px_32px_rgba(0,240,255,0.25)] before:via-cyan-300/60",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
