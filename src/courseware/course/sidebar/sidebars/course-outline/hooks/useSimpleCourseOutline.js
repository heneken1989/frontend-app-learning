import { useState, useCallback } from 'react';

export const useSimpleCourseOutline = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openOutline = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeOutline = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleOutline = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    openOutline,
    closeOutline,
    toggleOutline,
  };
};
