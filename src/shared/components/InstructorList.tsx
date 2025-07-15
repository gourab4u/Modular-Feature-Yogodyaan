import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstructorModal } from '../hooks/useInstructorModal';
import type { Instructor } from '../types';
import InstructorProfileModal from './InstructorProfileModal';

interface InstructorContextType {
  openInstructorModal: (instructor: Instructor) => void;
}

const InstructorContext = createContext<InstructorContextType | undefined>(undefined);

export const useInstructorContext = () => {
  const context = useContext(InstructorContext);
  if (!context) {
    throw new Error('useInstructorContext must be used within InstructorProvider');
  }
  return context;
};

interface InstructorProviderProps {
  children: React.ReactNode;
}

export const InstructorProvider: React.FC<InstructorProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { selectedInstructor, isModalOpen, openModal, closeModal } = useInstructorModal();

  const handleViewFullProfile = (instructorId: string) => {
    closeModal();
    navigate(`/instructor/${instructorId}`);
  };

  return (
    <InstructorContext.Provider value={{ openInstructorModal: openModal }}>
      {children}
      <InstructorProfileModal
        instructor={selectedInstructor}
        isOpen={isModalOpen}
        onClose={closeModal}
        onViewFullProfile={handleViewFullProfile}
      />
    </InstructorContext.Provider>
  );
};