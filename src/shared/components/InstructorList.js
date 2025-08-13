import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [selectedInstructor, setSelectedInstructor] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = (instructor) => {
        setSelectedInstructor(instructor);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setSelectedInstructor(null);
        setIsModalOpen(false);
    };
    const handleViewFullProfile = (instructorId) => {
        closeModal();
        navigate(`/instructor/${instructorId}`);
    };
    return (_jsxs(InstructorContext.Provider, { value: { openInstructorModal: openModal }, children: [children, isModalOpen && selectedInstructor && (_jsx("div", { className: "modal-backdrop", onClick: closeModal, children: _jsxs("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: selectedInstructor.full_name }), _jsx("p", { children: selectedInstructor.bio }), _jsx("button", { onClick: () => handleViewFullProfile(selectedInstructor.id), children: "View Full Profile" }), _jsx("button", { onClick: closeModal, children: "Close" })] }) }))] }));
};
