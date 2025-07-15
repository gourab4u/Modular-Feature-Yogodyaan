import React from 'react';
import type { Instructor } from '../types';
import { useInstructorContext } from './InstructorProvider';

interface InstructorLinkProps {
  instructor: Instructor;
  onOpenModal?: (instructor: Instructor) => void; // Make optional since we'll use context
  className?: string;
}

const InstructorLink: React.FC<InstructorLinkProps> = ({
  instructor,
  onOpenModal,
  className = ""
}) => {
  const { openInstructorModal } = useInstructorContext();
  const displayName = instructor.fullName || instructor.email;

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal(instructor);
    } else {
      openInstructorModal(instructor);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors ${className}`}
      type="button"
    >
      {displayName}
    </button>
  );
};

export default InstructorLink;