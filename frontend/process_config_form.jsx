// ProcessConfigForm.jsx - Admin component for process configuration

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ProcessConfigForm = () => {
  const { processId } = useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [process, setProcess] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scope: 'citywide',
    scopeDetails: '',
    accessLevel: 'verified',
    status: 'draft',
    phases: [createEmptyPhase()]
  });
  
  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated && !user.roles.includes('admin')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch process data if editing
  useEffect(() => {
    const fetchProcess = async () => {
      if (processId === 'new') {
        setIsLoading(false);
        return;
      }
      
      try {
        const res = await axios.get(`/api/processes/${processId}`);
        setProcess(res.data);
        
        // Format dates for the form
        const processData = {
          ...res.data,
          phases: res.data.phases.map(phase => ({
            ...phase,
            startDate: new Date(phase.startDate),
            endDate: new Date(phase.endDate)
          }))
        };
        
        setFormData(processData);
        setIsLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching process');
        setIsLoading(false);
      }
    };
    
    fetchProcess();
  }, [processId]);
  
  // Create empty phase object
  function createEmptyPhase() {
    return {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week
      activeComponents: []
    };
  }
  
  // Create empty component object
  function createEmptyComponent(type) {
    return {
      componentType: type,
      settings: getDefaultSettingsForType(type)
    };
  }
  
  // Get default settings based on component type
  function getDefaultSettingsForType(type) {
    switch (type) {
      case 'proposals':
        return {
          minSupporters: 0,
          requireModeration: true,
          allowComments: true
        };
      case 'voting':
        return {
          method: 'simple_majority',
          minOptions: 1,
          maxOptions: 1
        };
      case 'deliberation':
        return {
          mode: 'threaded',
          allowAnonymous: false
        };
      case 'budgeting':
        return {
          budget: 10000,
          minCost: 100,
          maxCost: 5000
        };
      case 'surveys':
        return {
          allowAnonymous: true,
          showResults: false
        };
      default:
        return {};
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handlePhaseChange = (index, field, value) => {
    const updatedPhases = [...formData.phases];
    updatedPhases[index][field] = value;
    setFormData({ ...formData, phases: updatedPhases });
  };
  
  const handleAddPhase = () => {
    setFormData({
      ...formData,
      phases: [...formData.phases, createEmptyPhase()]
    });
  };
  
  const handleRemovePhase = (index) => {
    const updatedPhases = [...formData.phases];
    updatedPhases.splice(index, 1);
    setFormData({ ...formData, phases: updatedPhases });
  };
  
  const toggleComponent = (phaseIndex, componentType) => {
    const updatedPhases = [...formData.phases];
    const phase = updatedPhases[phaseIndex];
    
    // Check if component already exists
    const componentIndex = phase.activeComponents.findIndex(
      c => c.componentType === componentType
    );
    
    if (componentIndex >= 0) {
      // Remove component
      phase.activeComponents.splice(componentIndex, 1);
    } else {
      // Add component
      phase.activeComponents.push(createEmptyComponent(componentType));
    }
    
    setFormData({ ...formData, phases: updatedPhases });
  };
  
  const handleComponentSettingChange = (phaseIndex, componentIndex, setting, value) => {
    const updatedPhases = [...formData.phases];
    updatedPhases[phaseIndex].activeComponents[componentIndex].settings[setting] = value;
    setFormData({ ...formData, phases: updatedPhases });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (processId === 'new') {
        response = await axios.post('/api/processes', formData);
      } else {
        response = await axios.put(`/api/processes/${processId}`, formData);
      }
      
      navigate(`/admin/processes/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving process');
    }
  };
  
  if (isLoading) return <div className="loader">{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="admin-process-config">
      <h1>
        {processId === 'new' 
          ? t('admin.process.create_title') 
          : t('admin.process.edit_title')
        }
      </h1>
      
      <form onSubmit={handleSubmit} className="process-form">
        <div className="form-section">
          <h2>{t('admin.process.basic_info')}</h2>
          
          <div className="form-group">
            <label htmlFor="title">{t('admin.process.title')}</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">{t('admin.process.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="form-control"
              rows="4"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scope">{t('admin.process.scope')}</label>
              <select
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="citywide">{t('admin.process.scopes.citywide')}</option>
                <option value="district">{t('admin.process.scopes.district')}</option>
                <option value="neighborhood">{t('admin.process.scopes.neighborhood')}</option>
                <option value="specific">{t('admin.process.scopes.specific')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="accessLevel">{t('admin.process.access_level')}</label>
              <select
                id="accessLevel"
                name="accessLevel"
                value={formData.accessLevel}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="open">{t('admin.process.access_levels.open')}</option>
                <option value="verified">{t('admin.process.access_levels.verified')}</option>
                <option value="resident">{t('admin.process.access_levels.resident')}</option>
                <option value="invited">{t('admin.process.access_levels.invited')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">{t('admin.process.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="draft">{t('admin.process.statuses.draft')}</option>
                <option value="active">{t('admin.process.statuses.active')}</option>
                <option value="completed">{t('admin.process.statuses.completed')}</option>
                <option value="archived">{t('admin.process.statuses.archived')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>{t('admin.process.phases')}</h2>
          <p className="section-help">{t('admin.process.phases_help')}</p>
          
          {formData.phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="phase-container">
              <h3>
                {t('admin.process.phase')} {phaseIndex + 1}
                {formData.phases.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemovePhase(phaseIndex)}
                  >
                    {t('common.remove')}
                  </button>
                )}
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.process.phase_name')}</label>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handlePhaseChange(phaseIndex, 'name', e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('admin.process.phase_description')}</label>
                  <input
                    type="text"
                    value={phase.description}
                    onChange={(e) => handlePhaseChange(phaseIndex, 'description', e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('admin.process.start_date')}</label>
                  <DatePicker
                    selected={phase.startDate}
                    onChange={(date) => handlePhaseChange(phaseIndex, 'startDate', date)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('admin.process.end_date')}</label>
                  <DatePicker
                    selected={phase.endDate}
                    onChange={(date) => handlePhaseChange(phaseIndex, 'endDate', date)}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={phase.startDate}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="components-container">
                <h4>{t('admin.process.active_components')}</h4>
                
                <div className="component-toggles">
                  {['proposals', 'voting', 'deliberation', 'budgeting', 'surveys'].map(component => {
                    const isActive = phase.activeComponents.some(
                      c => c.componentType === component
                    );
                    
                    return (
                      <div key={component} className="component-toggle">
                        <label className={`toggle-label ${isActive ? 'active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleComponent(phaseIndex, component)}
                          />
                          {t(`admin.components.${component}`)}
                        </label>
                      </div>
                    );
                  })}
                </div>
                
                {phase.activeComponents.length > 0 && (
                  <div className="component-settings">
                    <h4>{t('admin.process.component_settings')}</h4>
                    
                    {phase.activeComponents.map((component, componentIndex) => (
                      <div key={componentIndex} className="component-setting-group">
                        <h5>{t(`admin.components.${component.componentType}`)}</h5>
                        
                        {component.componentType === 'proposals' && (
                          <>
                            <div className="form-group">
                              <label>{t('admin.components.proposals.min_supporters')}</label>
                              <input
                                type="number"
                                min="0"
                                value={component.settings.minSupporters}
                                onChange={(e) => handleComponentSettingChange(
                                  phaseIndex, 
                                  componentIndex, 
                                  'minSupporters', 
                                  parseInt(e.target.value)
                                )}
                                className="form-control"
                              />
                            </div>
                            
                            <div className="form-check">
                              <input
                                type="checkbox"
                                id={`requireModeration-${phaseIndex}-${componentIndex}`}
                                checked={component.settings.requireModeration}
                                onChange={(e) => handleComponentSettingChange(
                                  phaseIndex,
                                  componentIndex,
                                  'requireModeration',
                                  e.target.checked
                                )}
                                className="form-check-input"
                              />
                              <label className="form-check-label">
                                {t('admin.components.proposals.require_moderation')}
                              </label>
                            </div>
                          </>
                        )}
                        
                        {component.componentType === 'voting' && (
                          <>
                            <div className="form-group">
                              <label>{t('admin.components.voting.method')}</label>
                              <select
                                value={component.settings.method}
                                onChange={(e) => handleComponentSettingChange(
                                  phaseIndex,
                                  componentIndex,
                                  'method',
                                  e.target.value
                                )}
                                className="form-control"
                              >
                                <option value="simple_majority">
                                  {t('admin.components.voting.methods.simple_majority')}
                                </option>
                                <option value="ranked_choice">
                                  {t('admin.components.voting.methods.ranked_choice')}
                                </option>
                                <option value="approval">
                                  {t('admin.components.voting.methods.approval')}
                                </option>
                                <option value="quadratic">
                                  {t('admin.components.voting.methods.quadratic')}
                                </option>
                              </select>
                            </div>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label>{t('admin.components.voting.min_options')}</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={component.settings.minOptions}
                                  onChange={(e) => handleComponentSettingChange(
                                    phaseIndex,
                                    componentIndex,
                                    'minOptions',
                                    parseInt(e.target.value)
                                  )}
                                  className="form-control"
                                />
                              </div>
                              
                              <div className="form-group">
                                <label>{t('admin.components.voting.max_options')}</label>
                                <input
                                  type="number"
                                  min={component.settings.minOptions}
                                  value={component.settings.maxOptions}
                                  onChange={(e) => handleComponentSettingChange(
                                    phaseIndex,
                                    componentIndex,
                                    'maxOptions',
                                    parseInt(e.target.value)
                                  )}
                                  className="form-control"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Similar settings would be added for other component types */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddPhase}
          >
            {t('admin.process.add_phase')}
          </button>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {processId === 'new' 
              ? t('admin.process.create_process') 
              : t('admin.process.update_process')
            }
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/processes')}
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProcessConfigForm;
