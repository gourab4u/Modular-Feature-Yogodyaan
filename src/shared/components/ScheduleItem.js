import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// import InstructorLink from './InstructorLink';
import { useInstructorContext } from './InstructorList';
const ScheduleItem = ({ scheduleItem }) => {
    const { openInstructorModal } = useInstructorContext();
    return (_jsxs("div", { className: "border-l-4 border-blue-500 pl-4 py-3", children: [_jsx("h4", { className: "font-semibold text-lg", children: scheduleItem.className }), _jsx("p", { className: "text-gray-600", children: scheduleItem.time }), _jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-sm text-gray-500", children: "with " }), _jsx("button", { onClick: () => openInstructorModal(scheduleItem.instructor), className: "text-sm text-blue-600 hover:text-blue-800 underline", children: scheduleItem.instructor?.full_name || scheduleItem.instructor?.name || 'Instructor' })] })] }));
};
export default ScheduleItem;
