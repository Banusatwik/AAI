import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, PageId } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { EvaluatePage } from './pages/EvaluatePage';
import { OperationsPage } from './pages/OperationsPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { ThresholdPage } from './pages/ThresholdPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { ProbabilityPage } from './pages/ProbabilityPage';
import { RiskScoringPage } from './pages/RiskScoringPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { PolicyManagementPage } from './pages/PolicyManagementPage';
import { PolicyGapsPage } from './pages/PolicyGapsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [gapCount, setGapCount] = useState<number>(0);

  const fetchGapCount = async () => {
    try {
      const gaps = await api.getGaps('OPEN');
      setGapCount(gaps.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGapCount();
    const interval = setInterval(fetchGapCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (page: PageId, extraData?: any) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-industrial-900 text-industrial-100 flex flex-col industrial-grid-bg">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onSelectPage={handleNavigate}
          gapCount={gapCount}
        />

        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {activePage === 'evaluate' && <EvaluatePage />}
            {activePage === 'operations' && <OperationsPage />}
            {activePage === 'equipment' && <EquipmentPage onNavigate={handleNavigate} />}
            {activePage === 'thresholds' && <ThresholdPage />}
            {activePage === 'statistics' && <StatisticsPage />}
            {activePage === 'probability' && <ProbabilityPage />}
            {activePage === 'risk_scoring' && <RiskScoringPage />}
            {activePage === 'optimization' && <OptimizationPage />}
            {activePage === 'policies' && <PolicyManagementPage />}
            {activePage === 'gaps' && <PolicyGapsPage />}
            {activePage === 'audit' && <AuditLogsPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
