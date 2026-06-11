import { logInfo } from '@edx/frontend-platform/logging';
import { camelCaseObject } from '@edx/frontend-platform';

import { getTimeOffsetMillis } from '../../course-home/data/api';

export function normalizeLearningSequencesData(learningSequencesData) {
  const models = {
    courses: {},
    sections: {},
    sequences: {},
  };

  const now = new Date();
  function isReleased(block) {
    // We check whether the backend marks this as accessible because staff users are granted access anyway.
    // Note that sections don't have the `accessible` field and will just be checking `effective_start`.
    return block.accessible || !block.effective_start || now >= Date.parse(block.effective_start);
  }

  // Sequences
  Object.entries(learningSequencesData.outline.sequences).forEach(([seqId, sequence]) => {
    if (!isReleased(sequence)) {
      return; // Don't let the learner see unreleased sequences
    }

    models.sequences[seqId] = {
      id: seqId,
      title: sequence.title,
    };
  });

  // Sections
  learningSequencesData.outline.sections.forEach(section => {
    // Filter out any ignored sequences (e.g. unreleased sequences)
    const availableSequenceIds = section.sequence_ids.filter(seqId => seqId in models.sequences);

    // If we are unreleased and already stripped out all our children, just don't show us at all.
    // (We check both release date and children because children will exist for an unreleased section even for staff,
    // so we still want to show this section.)
    if (!isReleased(section) && availableSequenceIds.length === 0) {
      return;
    }

    models.sections[section.id] = {
      id: section.id,
      title: section.title,
      sequenceIds: availableSequenceIds,
      courseId: learningSequencesData.course_key,
    };

    // Add back-references to this section for all child sequences.
    availableSequenceIds.forEach(childSeqId => {
      models.sequences[childSeqId].sectionId = section.id;
    });
  });

  // Course
  models.courses[learningSequencesData.course_key] = {
    id: learningSequencesData.course_key,
    title: learningSequencesData.title,
    sectionIds: Object.entries(models.sections).map(([sectionId]) => sectionId),

    // Scan through all the sequences and look for ones that aren't released yet.
    hasScheduledContent: Object.values(learningSequencesData.outline.sequences).some(seq => !isReleased(seq)),
  };

  return models;
}

export function normalizeMetadata(metadata) {
  const requestTime = Date.now();
  const responseTime = requestTime;
  const { data, headers } = metadata;
  return {
    accessExpiration: camelCaseObject(data.access_expiration),
    contentTypeGatingEnabled: data.content_type_gating_enabled,
    courseGoals: camelCaseObject(data.course_goals),
    id: data.id,
    title: data.name,
    offer: camelCaseObject(data.offer),
    enrollmentStart: data.enrollment_start,
    enrollmentEnd: data.enrollment_end,
    end: data.end,
    start: data.start,
    enrollmentMode: data.enrollment.mode,
    isEnrolled: data.enrollment.is_active,
    license: data.license,
    userTimezone: data.user_timezone,
    showCalculator: data.show_calculator,
    notes: camelCaseObject(data.notes),
    marketingUrl: data.marketing_url,
    celebrations: camelCaseObject(data.celebrations),
    userHasPassingGrade: data.user_has_passing_grade,
    courseExitPageIsActive: data.course_exit_page_is_active,
    certificateData: camelCaseObject(data.certificate_data),
    entranceExamData: camelCaseObject(data.entrance_exam_data),
    language: data.language,
    timeOffsetMillis: getTimeOffsetMillis(headers && headers.date, requestTime, responseTime),
    verifyIdentityUrl: data.verify_identity_url,
    verificationStatus: data.verification_status,
    linkedinAddToProfileUrl: data.linkedin_add_to_profile_url,
    relatedPrograms: camelCaseObject(data.related_programs),
    userNeedsIntegritySignature: data.user_needs_integrity_signature,
    canAccessProctoredExams: data.can_access_proctored_exams,
    learningAssistantEnabled: data.learning_assistant_enabled,
  };
}

export function normalizeSequenceMetadata(sequence) {
  return {
    sequence: {
      id: sequence.item_id,
      blockType: sequence.tag,
      unitIds: sequence.items.map(unit => unit.id),
      bannerText: sequence.banner_text,
      format: sequence.format,
      title: sequence.display_name,
      /*
      Example structure of gated_content when prerequisites exist:
      {
        prereq_id: 'id of the prereq section',
        prereq_url: 'unused by this frontend',
        prereq_section_name: 'Name of the prerequisite section',
        gated: true,
        gated_section_name: 'Name of this gated section',
      */
      gatedContent: camelCaseObject(sequence.gated_content),
      isTimeLimited: sequence.is_time_limited,
      isProctored: sequence.is_proctored,
      isHiddenAfterDue: sequence.is_hidden_after_due,
      // Position comes back from the server 1-indexed. Adjust here.
      activeUnitIndex: sequence.position ? sequence.position - 1 : 0,
      saveUnitPosition: sequence.save_position,
      showCompletion: sequence.show_completion,
      allowProctoringOptOut: sequence.allow_proctoring_opt_out,
      navigationDisabled: sequence.navigation_disabled,
    },
    units: sequence.items.map(unit => ({
      id: unit.id,
      sequenceId: sequence.item_id,
      bookmarked: unit.bookmarked,
      complete: unit.complete,
      title: unit.page_title,
      contentType: unit.type,
      graded: unit.graded,
      containsContentTypeGatedContent: unit.contains_content_type_gated_content,
    })),
  };
}

/**
 * Normalizes outline blocks for a given course.
 * @param {string} courseId - The unique identifier for the course.
 * @param {Object} blocks - An object containing different blocks of the course outline.
 * @returns {Object} - An object with normalized sections, sequences, and units.
 */
export function normalizeOutlineBlocks(courseId, blocks) {
  const models = {
    sections: {},
    sequences: {},
    units: {},
  };
  Object.values(blocks).forEach(block => {
    switch (block.type) {
      case 'chapter':
        models.sections[block.id] = {
          complete: block.complete,
          id: block.id,
          title: block.display_name,
          sequenceIds: block.children || [],
          completionStat: {
            completed: block.completion_stat?.completion,
            total: block.completion_stat?.completable_children,
          },
        };
        break;

      case 'sequential':
      case 'lock':
        models.sequences[block.id] = {
          complete: block.complete,
          id: block.id,
          title: block.display_name,
          type: block.type,
          specialExamInfo: block.special_exam_info,
          unitIds: block.children || [],
          completionStat: {
            completed: block.completion_stat?.completion,
            total: block.completion_stat?.completable_children,
          },
        };
        break;

      case 'vertical':
        models.units[block.id] = {
          complete: block.complete,
          resumeBlock: block.resume_block,
          icon: block.icon,
          id: block.id,
          title: block.display_name,
          type: block.type,
        };
        break;

      default:
        logInfo(`Unexpected course block type: ${block.type} with ID ${block.id}.  Expected block types are course, chapter, and sequential.`);
    }
  });

  return models;
}

const defaultGatedContent = (sectionTitle = '') => ({
  gated: false,
  prereqId: null,
  prereqUrl: null,
  prereqSectionName: null,
  gatedSectionName: sectionTitle,
});

/**
 * Pick which unit to open when landing on /course/:id/:sequenceId (no unit in URL).
 * 1. resume_block from navigation API (last completed unit in sequence)
 * 2. first incomplete unit in the sequence
 * 3. first unit
 */
export function resolveActiveUnitIndex(unitIds, units = {}) {
  if (!unitIds?.length) {
    return 0;
  }
  const resumeIndex = unitIds.findIndex((unitId) => units[unitId]?.resumeBlock);
  if (resumeIndex >= 0) {
    return resumeIndex;
  }
  const firstIncompleteIndex = unitIds.findIndex((unitId) => !units[unitId]?.complete);
  if (firstIncompleteIndex >= 0) {
    return firstIncompleteIndex;
  }
  return 0;
}

/**
 * Build sequence + unit models from course navigation outline (fast path).
 * Skips the heavy /api/courseware/sequence/ endpoint — no gating/proctored/bookmark data.
 */
export function mapOutlineToSequenceModels(courseOutline, sequenceId) {
  const { sequences = {}, sections = {}, units = {} } = courseOutline || {};
  const outlineSequence = sequences[sequenceId];
  if (!outlineSequence?.unitIds?.length) {
    return null;
  }

  let sectionId = null;
  Object.values(sections).some((section) => {
    if (section.sequenceIds?.includes(sequenceId)) {
      sectionId = section.id;
      return true;
    }
    return false;
  });

  const activeUnitIndex = resolveActiveUnitIndex(outlineSequence.unitIds, units);

  const sequence = {
    id: sequenceId,
    blockType: 'sequential',
    sectionId,
    unitIds: outlineSequence.unitIds,
    bannerText: null,
    format: outlineSequence.format || '',
    title: outlineSequence.title,
    gatedContent: defaultGatedContent(outlineSequence.title),
    isTimeLimited: false,
    isProctored: false,
    isHiddenAfterDue: false,
    activeUnitIndex,
    saveUnitPosition: true,
    showCompletion: true,
    allowProctoringOptOut: false,
    navigationDisabled: false,
  };

  const unitModels = outlineSequence.unitIds.map((unitId) => {
    const outlineUnit = units[unitId] || {};
    return {
      id: unitId,
      sequenceId,
      bookmarked: false,
      complete: outlineUnit.complete ?? false,
      title: outlineUnit.title || '',
      contentType: outlineUnit.icon || outlineUnit.type || 'other',
      graded: false,
      containsContentTypeGatedContent: false,
    };
  });

  return { sequence, units: unitModels };
}
