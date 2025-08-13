import { jsx as _jsx } from "react/jsx-runtime";
import { useInstructorContext } from './InstructorProvider';
const InstructorLink = ({ instructor, onOpenModal, className = "" }) => {
    const { openInstructorModal } = useInstructorContext();
    const displayName = instructor.fullName || instructor.email;
    const handleClick = () => {
        if (onOpenModal) {
            onOpenModal(instructor);
        }
        else {
            openInstructorModal(instructor);
        }
    };
    return (_jsx("button", { onClick: handleClick, className: `text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors ${className}`, type: "button", children: displayName }));
};
export default InstructorLink;
