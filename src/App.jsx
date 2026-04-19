import React from "react";
import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Calculator, Workflow, ShieldAlert, ShieldCheck } from "lucide-react";

import CalculatorV2 from "./pages/CalculatorV2";
import RuleFlowEditor from "./pages/RuleFlowEditor";

function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-green-700 text-white border-b-4 border-green-300 shadow-xl relative z-30">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="bg-green-300 p-1.5 rounded-full shadow-lg">
            <ShieldCheck className="w-6 h-6 text-green-800" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-sm md:text-lg uppercase leading-none">
              Calculadora de taxas e multas militares
            </span>
            <span className="text-[9px] text-green-300 font-bold uppercase tracking-[0.2em]">
              PRM 03/004 (SANTIAGO-RS)
            </span>
          </div>
        </div>

        <div className="flex gap-1 md:gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-t-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${location.pathname === "/" ? "bg-white text-green-800 border-t-2 border-x-2 border-green-300" : "hover:bg-green-600 text-green-200"}`}
          >
            <Calculator size={14} />{" "}
            <span className="hidden sm:inline">Calculadora</span>
          </Link>
          <Link
            to="/rules"
            className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-t-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${location.pathname === "/rules" ? "bg-white text-green-800 border-t-2 border-x-2 border-green-300" : "hover:bg-green-600 text-green-200"}`}
          >
            <Workflow size={14} />{" "}
            <span className="hidden sm:inline">Configurar Regras</span>
          </Link>
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
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">PRM 03/004 — Santiago-RS</span>
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
          © {new Date().getFullYear()} - Sistema de Uso Restrito - Apoio
          Administrativo JSM
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-green-50 flex flex-col font-sans">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CalculatorV2 />} />
            <Route path="/rules" element={<RuleFlowEditor />} />
            <Route
              path="*"
              element={
                <div className="flex flex-col justify-center items-center h-full p-8 gap-4">
                  <ShieldAlert size={64} className="text-rose-800" />
                  <h1 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">
                    Página não encontrada
                  </h1>
                  <Link
                    to="/"
                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-xs"
                  >
                    Voltar ao Início
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
