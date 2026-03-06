"use client";

import { useState, useEffect } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsList } from "@/components/ResultsList";
import { LeadDetail } from "@/components/LeadDetail";
import { Lead, SearchParams } from "@/types";
import { Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"search" | "results" | "detail">("search");
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [results, setResults] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setIsAdmin(data?.role === "admin"));
    });
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setError(null);
    setSearchParams(params);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro inesperado.");
      }

      setResults(data.results || []);
      setStep("results");
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setStep("detail");
  };

  const handleBackToSearch = () => {
    setStep("search");
    setResults([]);
    setSelectedLead(null);
  };

  const handleBackToResults = () => {
    setStep("results");
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleBackToSearch}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProspectAI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 hidden sm:block">
              Prospecção Inteligente B2B
            </span>
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {step === "search" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        )}

        {step === "results" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResultsList
              results={results}
              onSelectLead={handleSelectLead}
              onBack={handleBackToSearch}
            />
          </div>
        )}

        {step === "detail" && selectedLead && searchParams && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LeadDetail
              lead={selectedLead}
              searchParams={searchParams}
              onBack={handleBackToResults}
            />
          </div>
        )}
      </main>
    </div>
  );
}
