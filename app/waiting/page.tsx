"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function WaitingContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const isSetupPending = searchParams.get("setup") === "pending";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isSetupPending) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-100 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Setup do banco de dados pendente
        </h1>
        <p className="text-slate-500 text-sm mb-4">
          O administrador precisa executar o script SQL de configuração no Supabase para ativar o sistema de acesso.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-xs font-mono text-slate-600 break-all">
            Execute <strong>docs/supabase-setup.sql</strong> no SQL Editor do Supabase.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <div className="flex justify-center mb-4">
        <div className="bg-amber-100 p-4 rounded-full">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">
        Aguardando aprovação
      </h1>
      <p className="text-slate-500 text-sm mb-6">
        Sua solicitação de acesso foi recebida. O administrador irá
        analisar e aprovar em breve.
      </p>
      <Button variant="outline" onClick={handleLogout} className="w-full">
        Sair
      </Button>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            ProspectAI
          </span>
        </div>
        <Suspense>
          <WaitingContent />
        </Suspense>
      </div>
    </div>
  );
}
