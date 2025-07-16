import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
}

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
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedInstructor(null);
    setIsModalOpen(false);
  };

  const handleViewFullProfile = (instructorId: string) => {
    closeModal();
    navigate(`/instructor/${instructorId}`);
  };

  return (
    <InstructorContext.Provider value={{ openInstructorModal: openModal }}>
      {children}
      {/* Modal component would be imported properly in the future */}
      {isModalOpen && selectedInstructor && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedInstructor.full_name}</h3>
            <p>{selectedInstructor.bio}</p>
            <button onClick={() => handleViewFullProfile(selectedInstructor.id)}>
              View Full Profile
            </button>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </InstructorContext.Provider>
  );
};