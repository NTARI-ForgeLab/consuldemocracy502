// ProposalSystem.jsx - Component for submitting and browsing proposals

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

const ProposalSystem = () => {
  const { processId } = useParams();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [process, setProcess] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get process details
        const processRes = await axios.get(`/api/processes/${processId}`);
        setProcess(processRes.data);
        
        // Get proposals for this process
        const proposalsRes = await axios.get(`/api/proposals/process/${processId}`);
        setProposals(proposalsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [processId]);
  
  // Check if user can submit proposals
  const canSubmitProposals = () => {
    if (!isAuthenticated || !process) return false;
    
    // Find current phase
    const now = new Date();
    const currentPhase = process.phases.find(
      phase => new Date(phase.startDate) <= now && new Date(phase.endDate) >= now
    );
    
    if (!currentPhase) return false;
    
    // Check if proposals component is active in current phase
    return currentPhase.activeComponents.some(c => c.componentType === 'proposals');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleRichTextChange = (content) => {
    setFormData({ ...formData, content });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/processes/${processId}/proposals` } });
      return;
    }
    
    try {
      // Prepare tags array from comma-separated string
      const tagsArray = formData.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const newProposal = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        process: processId
      };
      
      const res = await axios.post('/api/proposals', newProposal);
      
      // Add the new proposal to the list
      setProposals([res.data, ...proposals]);
      
      // Reset form
      setFormData({
        title: '',
        summary: '',
        content: '',
        category: '',
        tags: ''
      });
      
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting proposal');
    }
  };
  
  if (loading) return <div className="loader">{t('common.loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="proposal-system">
      <h1>{process.title} - {t('proposals.title')}</h1>
      
      <div className="proposal-system-controls">
        {canSubmitProposals() ? (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? t('common.cancel') : t('proposals.create_new')}
          </button>
        ) : (
          isAuthenticated ? (
            <p className="info-message">{t('proposals.submission_closed')}</p>
          ) : (
            <p className="info-message">
              {t('proposals.login_to_submit')}
              <button onClick={() => navigate('/login')} className="btn btn-link">
                {t('auth.login')}
              </button>
            </p>
          )
        )}
        
        <div className="proposal-filters">
          {/* Filters would go here */}
        </div>
      </div>
      
      {showForm && (
        <div className="proposal-form-container">
          <h2>{t('proposals.form_title')}</h2>
          <form onSubmit={handleSubmit} className="proposal-form">
            <div className="form-group">
              <label htmlFor="title">{t('proposals.form_title_label')}</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength="100"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="summary">{t('proposals.form_summary_label')}</label>
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                maxLength="300"
                className="form-control"
                rows="3"
              />
              <small>{t('proposals.form_summary_help')}</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="content">{t('proposals.form_content_label')}</label>
              <RichTextEditor
                initialContent={formData.content}
                onChange={handleRichTextChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">{t('proposals.form_category_label')}</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">{t('common.select_option')}</option>
                <option value="environment">{t('categories.environment')}</option>
                <option value="mobility">{t('categories.mobility')}</option>
                <option value="housing">{t('categories.housing')}</option>
                <option value="culture">{t('categories.culture')}</option>
                <option value="social">{t('categories.social')}</option>
                <option value="economy">{t('categories.economy')}</option>
                <option value="other">{t('categories.other')}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="tags">{t('proposals.form_tags_label')}</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="form-control"
              />
              <small>{t('proposals.form_tags_help')}</small>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {t('proposals.submit')}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="proposals-list">
        <h2>{t('proposals.list_title')} ({proposals.length})</h2>
        
        {proposals.length === 0 ? (
          <p>{t('proposals.no_proposals')}</p>
        ) : (
          proposals.map(proposal => (
            <div key={proposal._id} className="proposal-card">
              <div className="proposal-header">
                <h3>{proposal.title}</h3>
                <div className="proposal-meta">
                  <span className="proposal-author">
                    {t('common.by')}: {proposal.author.username}
                  </span>
                  <span className="proposal-date">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </span>
                  <span className="proposal-category">
                    {t(`categories.${proposal.category || 'other'}`)}
                  </span>
                </div>
              </div>
              
              <div className="proposal-summary">
                {proposal.summary}
              </div>
              
              <div className="proposal-footer">
                <div className="proposal-tags">
                  {proposal.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                
                <div className="proposal-stats">
                  <span className="support-count">
                    {proposal.supportCount || 0} {t('proposals.supports')}
                  </span>
                  
                  <span className="comments-count">
                    {proposal.commentCount || 0} {t('common.comments')}
                  </span>
                </div>
                
                <div className="proposal-actions">
                  {isAuthenticated && (
                    <button 
                      className={`btn btn-support ${proposal.userHasSupported ? 'supported' : ''}`}
                      onClick={() => handleSupportProposal(proposal._id)}
                      disabled={proposal.userHasSupported}
                    >
                      {proposal.userHasSupported 
                        ? t('proposals.supported') 
                        : t('proposals.support')}
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(`/proposals/${proposal._id}`)}
                  >
                    {t('common.view_details')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProposalSystem;
