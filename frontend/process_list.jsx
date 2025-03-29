// ProcessList.jsx - Component showing active participation processes

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ProcessList = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await axios.get('/api/processes/active');
        setProcesses(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching processes');
        setLoading(false);
      }
    };
    
    fetchProcesses();
  }, []);
  
  if (loading) return <div className="loader">{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  // Filter processes that are currently in active phases
  const now = new Date();
  const activeProcesses = processes.filter(process => 
    process.phases.some(phase => new Date(phase.startDate) <= now && new Date(phase.endDate) >= now)
  );
  
  return (
    <div className="processes-container">
      <h1>{t('processes.active_title')}</h1>
      
      {activeProcesses.length === 0 ? (
        <p>{t('processes.no_active')}</p>
      ) : (
        <div className="process-cards">
          {activeProcesses.map(process => {
            // Find the current active phase
            const currentPhase = process.phases.find(
              phase => new Date(phase.startDate) <= now && new Date(phase.endDate) >= now
            );
            
            // Get a list of active components in this phase
            const activeComponents = currentPhase 
              ? currentPhase.activeComponents.map(c => c.componentType) 
              : [];
              
            return (
              <div key={process._id} className="process-card">
                <h2>{process.title}</h2>
                <p>{process.description}</p>
                
                <div className="process-meta">
                  <span className="process-scope">
                    {t(`processes.scopes.${process.scope}`)}
                  </span>
                  
                  <span className="process-phase">
                    {currentPhase 
                      ? t('processes.current_phase', { name: currentPhase.name }) 
                      : t('processes.no_active_phase')
                    }
                  </span>
                </div>
                
                <div className="process-components">
                  {activeComponents.map(component => (
                    <span key={component} className="component-badge">
                      {t(`components.${component}`)}
                    </span>
                  ))}
                </div>
                
                <div className="process-timeline">
                  {currentPhase && (
                    <div className="timeline-info">
                      <span>{t('processes.ends_in')}: </span>
                      <TimeRemaining endDate={currentPhase.endDate} />
                    </div>
                  )}
                </div>
                
                <Link to={`/processes/${process._id}`} className="btn btn-primary">
                  {t('processes.view_details')}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper component to show remaining time
const TimeRemaining = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const { t } = useTranslation();
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft(t('common.ended'));
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days} ${t('common.days')} ${hours} ${t('common.hours')}`);
      } else {
        setTimeLeft(`${hours} ${t('common.hours')}`);
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000 * 60 * 60); // Update hourly
    
    return () => clearInterval(timer);
  }, [endDate, t]);
  
  return <span className="time-remaining">{timeLeft}</span>;
};

export default ProcessList;
