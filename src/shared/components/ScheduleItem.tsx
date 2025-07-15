import React from 'react';
import InstructorLink from './InstructorLink';
import { useInstructorContext } from './InstructorProvider';

interface ScheduleItemProps {
    scheduleItem: {
        id: string;
        className: string;
        time: string;
        instructor: Instructor;
        // ...other properties...
    };
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ scheduleItem }) => {
    const { openInstructorModal } = useInstructorContext();

    return (
        <div className="border-l-4 border-blue-500 pl-4 py-3">
            <h4 className="font-semibold text-lg">{scheduleItem.className}</h4>
            <p className="text-gray-600">{scheduleItem.time}</p>

            <div className="mt-2">
                <span className="text-sm text-gray-500">with </span>
                <InstructorLink
                    instructor={scheduleItem.instructor}
                    onOpenModal={openInstructorModal}
                    className="text-sm"
                />
            </div>
        </div>
    );
};

export default ScheduleItem;