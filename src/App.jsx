import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calculator, Workflow, ShieldAlert, Star, ShieldCheck } from 'lucide-react';

// Importando as páginas
import CalculatorV2 from './pages/CalculatorV2';
import RuleFlowEditor from './pages/RuleFlowEditor';

// Componente de navegação com visual militar (EB)
function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-[#3A3F1C] text-white border-b-4 border-[#D4AF37] shadow-xl relative z-30">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <div className="bg-[#D4AF37] p-1.5 rounded-full shadow-lg">
            <ShieldCheck className="w-6 h-6 text-[#3A3F1C]" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-sm md:text-lg uppercase leading-none">Sistema de Apoio Jurídico</span>
            <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-[0.2em]">Junta de Serviço Militar</span>
          </div>
        </div>

        <div className="flex gap-1 md:gap-2">
          <Link 
            to="/" 
            className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-t-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${location.pathname === '/' ? 'bg-[#F4F4F0] text-[#3A3F1C] border-t-2 border-x-2 border-[#D4AF37]' : 'hover:bg-[#4B5320] text-slate-300'}`}
          >
            <Calculator size={14} /> <span className="hidden sm:inline">Calculadora</span>
          </Link>
          <Link 
            to="/rules" 
            className={`flex items-center gap-2 px-3 md:px-5 py-2 rounded-t-lg font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${location.pathname === '/rules' ? 'bg-[#F4F4F0] text-[#3A3F1C] border-t-2 border-x-2 border-[#D4AF37]' : 'hover:bg-[#4B5320] text-slate-300'}`}
          >
            <Workflow size={14} /> <span className="hidden sm:inline">Configurar Regras</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Rodapé Institucional
function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-8 border-t-4 border-[#4B5320] print:hidden">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Star className="text-[#D4AF37] fill-[#D4AF37]" size={24} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Tecnologia e Defesa</span>
            <span className="text-xs font-bold text-slate-400 italic">"Braço Forte, Mão Amiga"</span>
          </div>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Desenvolvimento do Sistema</p>
          <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">Gustavo Lopes Tamiosso</p>
          <p className="text-sm font-bold text-slate-200 uppercase tracking-tight">Juliano Silva Tamiosso</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-6 pt-6 border-t border-slate-800 text-center">
        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">© {new Date().getFullYear()} - Sistema de Uso Restrito - Apoio Administrativo JSM</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-[#F4F4F0] flex flex-col font-sans">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<CalculatorV2 />} />
            <Route path="/rules" element={<RuleFlowEditor />} />
            <Route path="*" element={
              <div className="flex flex-col justify-center items-center h-full p-8 gap-4">
                <ShieldAlert size={64} className="text-rose-800" />
                <h1 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">Página não encontrada</h1>
                <Link to="/" className="bg-[#4B5320] text-white px-6 py-2 rounded-xl font-bold uppercase text-xs">Voltar ao Início</Link>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
}
