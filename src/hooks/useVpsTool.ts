// Vextagon — shared hook for VPS tool execution
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VpsToolResult {
  success: boolean;
  tool: string;
  target: string;
  output?: any;
  error?: string;
  execution_time?: number;
  [key: string]: any;
}

export function useVpsTool() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runTool = async (
    tool: string,
    target: string,
    options: Record<string, any> = {}
  ): Promise<VpsToolResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("vps-proxy", {
        body: { tool, target, options },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      return data as VpsToolResult;
    } catch (err: any) {
      const msg = err.message || "Erro ao executar ferramenta";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { runTool, loading, error };
}
