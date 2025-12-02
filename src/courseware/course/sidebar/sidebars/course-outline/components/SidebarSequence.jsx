import { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Collapsible } from '@openedx/paragon';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

import courseOutlineMessages from '@src/course-home/outline-tab/messages';
import { useCourseOutlineSidebar } from '../hooks';
import CompletionIcon from './CompletionIcon';
import SidebarUnit from './SidebarUnit';
import { UNIT_ICON_TYPES } from './UnitIcon';

const SidebarSequence = ({
  intl,
  courseId,
  defaultOpen,
  sequence,
  activeUnitId,
}) => {
  const {
    id,
    complete,
    title,
    specialExamInfo,
    unitIds,
    type,
    completionStat,
  } = sequence;

  const [open, setOpen] = useState(defaultOpen);
  const [accessInfo, setAccessInfo] = useState(null);
  const [fetchedSection, setFetchedSection] = useState(null);
  const { activeSequenceId, units, sections } = useCourseOutlineSidebar();
  const isActiveSequence = id === activeSequenceId;
  
  // Get section info from model store (if available)
  const section = sequence?.sectionId ? sections?.[sequence.sectionId] : null;
  
  // Fetch section from API directly (optimized - fetch immediately, don't wait for model store)
  useEffect(() => {
    const fetchSectionInfo = async () => {
      // Fetch from API if we have courseId and sequenceId
      if (courseId && id) {
        try {
          const lmsBaseUrl = getConfig().LMS_BASE_URL;
          // Fetch section info from course outline API
          const sectionsResponse = await fetch(`${lmsBaseUrl}/api/all_courses/${courseId}/sections/`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-cache', // Prevent caching
          });
          
          if (sectionsResponse.ok) {
            const sectionsData = await sectionsResponse.json();
            // Find section that contains this sequence
            for (const sec of sectionsData) {
              const sequencesResponse = await fetch(`${lmsBaseUrl}/api/sections/${sec.id}/sequences/`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache', // Prevent caching
              });
              if (sequencesResponse.ok) {
                const sequencesData = await sequencesResponse.json();
                const hasSequence = sequencesData.some(seq => seq.id === id);
                if (hasSequence) {
                  setFetchedSection({
                    id: sec.id,
                    title: sec.display_name || sec.title || 'Unknown Section',
                  });
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.warn('🔍 [SidebarSequence] Failed to fetch section info:', error);
        }
      }
    };
    
    fetchSectionInfo();
  }, [courseId, id]); // Only depend on courseId and id, fetch immediately
  
  // Use fetched section from API first (optimized), then fallback to model store
  const currentSection = fetchedSection || section;
  // Try multiple sources for section title
  const sectionDisplayName = currentSection?.title || currentSection?.display_name || '';
  
  // Debug: Log section info
  useEffect(() => {
    if (sequence?.sectionId || fetchedSection) {
      console.log('🔍 [SidebarSequence] Section info:', {
        sequenceId: id,
        sequenceTitle: title,
        sequenceSectionId: sequence?.sectionId,
        section: section,
        fetchedSection: fetchedSection,
        currentSection: currentSection,
        sectionTitle: currentSection?.title,
        sectionDisplayName: sectionDisplayName,
        sectionSource: section ? 'model-store' : (fetchedSection ? 'api-fetch' : 'none'),
        allSections: Object.keys(sections || {}).map(key => ({
          id: key,
          title: sections[key]?.title,
          display_name: sections[key]?.display_name
        }))
      });
    }
  }, [sequence?.sectionId, section, fetchedSection, currentSection, sectionDisplayName, id, sections, title]);

  // Fetch user access_info
  useEffect(() => {
    const fetchAccessInfo = async () => {
      try {
        const user = getAuthenticatedUser();
        if (!user) {
          // Free user - default access
          setAccessInfo({ access_type: 'free', unit_limit: 20 });
          return;
        }

        const lmsBaseUrl = getConfig().LMS_BASE_URL;
        const response = await fetch(`${lmsBaseUrl}/api/payment/user/access-info/`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-cache', // Prevent caching
        });

        if (response.ok) {
          const data = await response.json();
          const accessInfoData = data.access_info || { access_type: 'free', unit_limit: 20 };
          console.log('🔍 [SidebarSequence] Fetched access_info:', accessInfoData);
          setAccessInfo(accessInfoData);
        } else {
          // Default to free if API fails
          console.warn('🔍 [SidebarSequence] API failed, defaulting to free');
          setAccessInfo({ access_type: 'free', unit_limit: 20 });
        }
      } catch (error) {
        console.warn('Failed to fetch access_info, defaulting to free:', error);
        setAccessInfo({ access_type: 'free', unit_limit: 20 });
      }
    };

    fetchAccessInfo();
    
    // Refresh access_info when storage changes (e.g., after activating section)
    const handleStorageChange = (e) => {
      if (e.key === 'access_info_updated' || !e.key) {
        fetchAccessInfo();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-origin updates
    window.addEventListener('accessInfoUpdated', fetchAccessInfo);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('accessInfoUpdated', fetchAccessInfo);
    };
  }, []);

  // Filter unitIds based on access_info
  const filteredUnitIds = useMemo(() => {
    if (!accessInfo) {
      // While loading, show all units (optimistic)
      return unitIds;
    }

    // Debug logging
    console.log('🔍 [SidebarSequence] Filtering units:', {
      sequenceId: id,
      sequenceTitle: title,
      sectionDisplayName,
      accessType: accessInfo.access_type,
      allowedSections: accessInfo.allowed_sections,
      unitLimit: accessInfo.unit_limit,
      totalUnits: unitIds.length,
    });

    // If user has subscription (access_type === 'subscribed'), show all units
    if (accessInfo.access_type === 'subscribed') {
      console.log('🔍 [SidebarSequence] Subscribed user - showing all units');
      return unitIds;
    }

    // Check section access for section_access users
    if (accessInfo.access_type === 'section_access' && accessInfo.allowed_sections) {
      // Normalize section names for comparison (trim whitespace, handle encoding, case-insensitive)
      const normalizeSectionName = (name) => {
        if (!name) return '';
        // Convert to string, trim, normalize whitespace, and handle potential encoding issues
        return String(name)
          .trim()
          .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
          .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
      };
      
      const normalizedSectionDisplayName = normalizeSectionName(sectionDisplayName);
      const normalizedAllowedSections = accessInfo.allowed_sections.map(normalizeSectionName);
      const excludedSections = accessInfo.excluded_sections || [];
      const normalizedExcludedSections = excludedSections.map(normalizeSectionName);
      
      // Check if section is excluded
      const isExcluded = excludedSections.includes(sectionDisplayName) || 
                         normalizedExcludedSections.includes(normalizedSectionDisplayName);
      
      // If section is excluded, limit to 20 units
      if (isExcluded) {
        console.log('🔍 [SidebarSequence] ❌ Section is excluded - limiting to 20 units');
        return unitIds.slice(0, 20);
      }
      
      // Check if allowed_sections is ['*'] (all sections)
      const hasAllSections = accessInfo.allowed_sections.includes('*') || 
                             normalizedAllowedSections.includes('*');
      
      if (hasAllSections) {
        // All sections allowed (except excluded ones, which we already checked)
        console.log('🔍 [SidebarSequence] ✅ All sections access - showing all units');
        return unitIds;
      }
      
      // Check if section title is in allowed_sections (with normalization)
      // Try both exact match and normalized match
      const exactMatch = sectionDisplayName && accessInfo.allowed_sections.includes(sectionDisplayName);
      const normalizedMatch = normalizedSectionDisplayName && normalizedAllowedSections.includes(normalizedSectionDisplayName);
      const isMatch = exactMatch || normalizedMatch;
      
      // Debug: Check if sectionDisplayName matches
      console.log('🔍 [SidebarSequence] Section access check:', {
        sequenceId: id,
        sequenceTitle: title,
        sectionDisplayName,
        normalizedSectionDisplayName,
        allowedSections: accessInfo.allowed_sections,
        normalizedAllowedSections,
        exactMatch,
        normalizedMatch,
        isMatch,
        sectionDisplayNameType: typeof sectionDisplayName,
        sectionDisplayNameLength: sectionDisplayName?.length,
        firstAllowedSection: accessInfo.allowed_sections[0],
        firstAllowedSectionNormalized: normalizedAllowedSections[0],
        totalUnits: unitIds.length,
      });
      
      // If section title is in allowed_sections, show all units
      if (isMatch) {
        console.log('🔍 [SidebarSequence] ✅ Section access user with access to this section - showing all units');
        return unitIds; // Full access to this section
      }
      // Otherwise, limit to 20 units (free access)
      console.log('🔍 [SidebarSequence] ❌ Section access user without access to this section - limiting to 20 units');
      console.log('🔍 [SidebarSequence] ❌ Match failed:');
      console.log('🔍   - sectionDisplayName (raw):', JSON.stringify(sectionDisplayName));
      console.log('🔍   - sectionDisplayName (normalized):', JSON.stringify(normalizedSectionDisplayName));
      console.log('🔍   - allowed_sections (raw):', JSON.stringify(accessInfo.allowed_sections));
      console.log('🔍   - allowed_sections (normalized):', JSON.stringify(normalizedAllowedSections));
      console.log('🔍   - exactMatch:', exactMatch);
      console.log('🔍   - normalizedMatch:', normalizedMatch);
      const limit = 20;
      return unitIds.slice(0, limit);
    }

    // Free users: limit to first N units
    const limit = accessInfo.unit_limit || 20;
    console.log('🔍 [SidebarSequence] Free user - limiting to', limit, 'units');
    return unitIds.slice(0, limit);
  }, [unitIds, accessInfo, sectionDisplayName, id, title]);

  const sectionTitle = (
    <>
      <div className="col-auto p-0" style={{ fontSize: '1.1rem' }}>
        <CompletionIcon completionStat={completionStat} />
      </div>
      <div className="col-9 d-flex flex-column flex-grow-1 ml-3 mr-auto p-0 text-left">
        <span className="align-middle text-dark-500">{title}</span>
        {specialExamInfo && <span className="align-middle small text-muted">{specialExamInfo}</span>}
        <span className="sr-only">
          , {intl.formatMessage(complete
          ? courseOutlineMessages.completedAssignment
          : courseOutlineMessages.incompleteAssignment)}
        </span>
      </div>
    </>
  );

  return (
    <li>
      <Collapsible
        className={classNames('mb-2', { 'active-section': isActiveSequence, 'bg-info-100': isActiveSequence && !open })}
        styling="card-lg text-break"
        title={sectionTitle}
        open={open}
        onToggle={() => setOpen(!open)}
      >
        <ol className="list-unstyled">
          {filteredUnitIds.map((unitId, index) => (
            <SidebarUnit
              key={unitId}
              id={unitId}
              courseId={courseId}
              sequenceId={id}
              unit={units[unitId]}
              isActive={activeUnitId === unitId}
              activeUnitId={activeUnitId}
              isFirst={index === 0}
              isLocked={type === UNIT_ICON_TYPES.lock}
            />
          ))}
          {accessInfo && 
           (accessInfo.access_type === 'free' || 
            (accessInfo.access_type === 'section_access' && 
             sectionDisplayName && 
             !accessInfo.allowed_sections?.includes(sectionDisplayName))) &&
           unitIds.length > filteredUnitIds.length && (
            <li style={{ padding: '12px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
              <span>
                {`+${unitIds.length - filteredUnitIds.length} more units. `}
                <a href="/learning/payment" style={{ color: '#00838f', textDecoration: 'underline' }}>
                  Upgrade to see all
                </a>
              </span>
            </li>
          )}
        </ol>
      </Collapsible>
    </li>
  );
};

SidebarSequence.propTypes = {
  intl: intlShape.isRequired,
  courseId: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool.isRequired,
  sequence: PropTypes.shape({
    complete: PropTypes.bool,
    id: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    specialExamInfo: PropTypes.string,
    unitIds: PropTypes.arrayOf(PropTypes.string),
    completionStat: PropTypes.shape({
      completed: PropTypes.number,
      total: PropTypes.number,
    }),
  }).isRequired,
  activeUnitId: PropTypes.string.isRequired,
};

export default injectIntl(SidebarSequence);
