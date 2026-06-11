import { useState, useMemo } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import { Collapsible } from '@openedx/paragon';
import courseOutlineMessages from '@src/course-home/outline-tab/messages';
import useAccessInfo from '@src/courseware/hooks/useAccessInfo';
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
  const accessInfo = useAccessInfo();
  const { activeSequenceId, units, sections } = useCourseOutlineSidebar();
  const isActiveSequence = id === activeSequenceId;

  // Resolve parent section from course outline already in Redux (no extra API calls).
  const currentSection = useMemo(() => {
    if (sequence?.sectionId && sections?.[sequence.sectionId]) {
      return sections[sequence.sectionId];
    }
    return Object.values(sections || {}).find(
      (sec) => sec.sequenceIds?.includes(id),
    ) || null;
  }, [sequence?.sectionId, sections, id]);

  const sectionDisplayName = currentSection?.title || currentSection?.display_name || '';

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
