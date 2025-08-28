import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardScreen from './screens/DashboardScreen';
import PrescriptionBuilderScreen from './screens/PrescriptionBuilderScreen';
import Header from './components/Header';
import SearchResultsScreen from './screens/SearchResultsScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import MyPrescriptionsScreen from './screens/MyPrescriptionsScreen';
import ProfileScreen from './screens/ProfileScreen';

function App() {
  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <Header />
      <main>
        <Routes>
          {/* Todas as rotas agora são públicas */}
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/search-results/:query" element={<SearchResultsScreen />} />
          <Route path="/prescription/:diagnosis" element={<PrescriptionBuilderScreen />} />
          <Route path="/calculators" element={<CalculatorScreen />} />
          <Route path="/my-prescriptions" element={<MyPrescriptionsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          
          {/* Rota Raiz: redireciona para o dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Rota de fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;