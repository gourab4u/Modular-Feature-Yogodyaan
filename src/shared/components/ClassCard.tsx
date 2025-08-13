import React from 'react';
import InstructorLink from '../../features/scheduling/components/InstructorLink';
import { useInstructorContext } from '../../features/scheduling/components/InstructorProvider';

interface ClassCardProps {
    class: {
        id: string;
        name: string;
        instructor: any;
        // ...other class properties...
    };
}

const ClassCard: React.FC<ClassCardProps> = ({ class: classData }) => {
    const { openInstructorModal } = useInstructorContext();

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* ...existing code... */}
            <h3 className="text-xl font-semibold mb-2">{classData.name}</h3>

            <div className="flex items-center mb-4">
                <span className="text-gray-600 mr-2">Instructor:</span>
                <InstructorLink
                    instructor={classData.instructor}
                    onOpenModal={openInstructorModal}
                    className="font-medium"
                />
            </div>

            {/* ...existing code... */}
        </div>
    );
};

export default ClassCard;