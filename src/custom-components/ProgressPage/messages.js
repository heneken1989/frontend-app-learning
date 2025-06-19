import { defineMessages } from '@edx/frontend-platform/i18n';

const messages = defineMessages({
  subsequenceProgressDescription: {
    id: 'learning.progress.subsequence.description',
    defaultMessage: 'Track your progress through this section of the course.',
    description: 'Description text explaining the subsequence progress visualization.',
  },
  complete: {
    id: 'learning.progress.complete',
    defaultMessage: 'Complete',
    description: 'Label indicating complete status',
  },
  completed: {
    id: 'learning.progress.completed',
    defaultMessage: 'Completed',
    description: 'Label for completed percentage',
  },
  remaining: {
    id: 'learning.progress.remaining',
    defaultMessage: 'Remaining',
    description: 'Label for remaining percentage',
  },
  startLearning: {
    id: 'learning.progress.start',
    defaultMessage: 'Start Learning',
    description: 'Button text to start learning',
  },
  continueLearning: {
    id: 'learning.progress.continue',
    defaultMessage: 'Continue Learning',
    description: 'Button text to continue learning',
  },
  errorLoading: {
    id: 'learning.progress.error.loading',
    defaultMessage: 'Error Loading Progress',
    description: 'Error message when progress data fails to load',
  },
});

export default messages; 