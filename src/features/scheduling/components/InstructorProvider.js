import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstructorModal } from '../hooks/useInstructorModal';
import InstructorProfileModal from './InstructorProfileModal';
const InstructorContext = createContext(undefined);
export const useInstructorContext = () => {
    const context = useContext(InstructorContext);
    if (!context) {
        throw new Error('useInstructorContext must be used within InstructorProvider');
    }
    return context;
};
export const InstructorProvider = ({ children }) => {
    const navigate = useNavigate();
    const { selectedInstructor, isModalOpen, openModal, closeModal } = useInstructorModal();
    const handleViewFullProfile = (instructorId) => {
        closeModal();
        navigate(`/instructor/${instructorId}`);
    };
    return (_jsxs(InstructorContext.Provider, { value: { openInstructorModal: openModal }, children: [children, _jsx(InstructorProfileModal, { instructor: selectedInstructor, isOpen: isModalOpen, onClose: closeModal, onViewFullProfile: handleViewFullProfile })] }));
};
