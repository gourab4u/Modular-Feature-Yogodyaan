import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import InstructorLink from '../../features/scheduling/components/InstructorLink';
import { useInstructorContext } from '../../features/scheduling/components/InstructorProvider';
const ClassCard = ({ class: classData }) => {
    const { openInstructorModal } = useInstructorContext();
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-xl font-semibold mb-2", children: classData.name }), _jsxs("div", { className: "flex items-center mb-4", children: [_jsx("span", { className: "text-gray-600 mr-2", children: "Instructor:" }), _jsx(InstructorLink, { instructor: classData.instructor, onOpenModal: openInstructorModal, className: "font-medium" })] })] }));
};
export default ClassCard;
