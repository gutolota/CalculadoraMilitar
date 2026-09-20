import React from "react";
import { ShieldCheck } from "lucide-react";

import CalculatorV2 from "./pages/CalculatorV2";

function Navigation() {
  return (
    <nav className="bg-green-700 text-white border-b-4 border-green-300 shadow-xl relative z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="bg-green-300 p-1.5 rounded-full shadow-lg">
            <ShieldCheck className="w-6 h-6 text-green-800" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-sm md:text-lg uppercase leading-none">
              Calculadora de taxas e multas militares
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-8 border-t-4 border-green-600 print:hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-green-400" size={24} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">
            PRM 03/004 — Santiago-RS
          </span>
        </div>

        <div className="text-center md:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Desenvolvimento do Sistema
          </p>
          <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">
            Gustavo Lopes Tamiosso
          </p>
          <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">
            Juliano Silva Tamiosso
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-6 pt-6 border-t border-slate-800 text-center">
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} - Sistema de Uso Restrito - Apoio Administrativo JSM
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col font-sans">
      <Navigation />
      <main className="flex-1">
        <CalculatorV2 />
      </main>
      <Footer />
    </div>
  );
}
