import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// Importando as duas versões da calculadora
import CalculatorV1 from './pages/CalculatorV1';
import CalculatorV2 from './pages/CalculatorV2';

// Um componente simples de navegação para alternar entre as versões
function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-center gap-6">
      <Link 
        to="/" 
        className={`font-bold transition-colors ${location.pathname === '/' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
      >
        Versão 1 (Atual)
      </Link>
      <Link 
        to="/v2" 
        className={`font-bold transition-colors ${location.pathname === '/v2' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-300 hover:text-emerald-300'}`}
      >
        Versão 2 (Nova Lei)
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    // O atributo basename DEVE ser exatamente igual ao 'base' do seu vite.config.js
    <HashRouter basename="/CalculadoraMilitar">
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Barra de navegação visível em todas as telas */}
        <Navigation />

        {/* Área onde as calculadoras vão renderizar */}
        <main className="flex-1">
          <Routes>
            {/* Rota raiz carrega a versão antiga */}
            <Route path="/" element={<CalculatorV1 />} />
            
            {/* Rota /v2 carrega a versão nova */}
            <Route path="/v2" element={<CalculatorV2 />} />
            
            {/* Fallback caso o usuário digite um link errado */}
            <Route path="*" element={
              <div className="flex justify-center items-center h-full p-8">
                <h1 className="text-2xl font-bold text-slate-700">Página não encontrada</h1>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}