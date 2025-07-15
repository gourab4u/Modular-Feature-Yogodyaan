import { useState } from 'react';
export const useInstructorModal = () => {
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = (instructor) => {
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
