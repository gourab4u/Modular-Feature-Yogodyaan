import { useState } from 'react';
import type { Instructor } from '../types';

export const useInstructorModal = () => {
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInstructor(null);
  };

  return {
    selectedInstructor,
    isModalOpen,
    openModal,
    closeModal
  };
};