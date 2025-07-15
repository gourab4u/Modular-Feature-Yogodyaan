import { Calendar, Mail, Phone, User, X } from 'lucide-react';
import React from 'react';
import type { Instructor } from '../types';

interface InstructorProfileModalProps {
  instructor: Instructor | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullProfile: (instructorId: string) => void;
}

const InstructorProfileModal: React.FC<InstructorProfileModalProps> = ({
  instructor,
  isOpen,
  onClose,
  onViewFullProfile
}) => {
  if (!isOpen || !instructor) return null;

  const displayName = instructor.fullName || instructor.email;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Instructor Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Image */}
          <div className="flex justify-center mb-4">
            {instructor.profileImage || instructor.avatar_url ? (
              <img
                src={instructor.profileImage || instructor.avatar_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <User size={32} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">{displayName}</h3>
            {instructor.specialization && (
              <p className="text-gray-600 mb-2">{instructor.specialization}</p>
            )}
            {instructor.experience && (
              <p className="text-sm text-gray-500">
                {instructor.experience} years experience
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <Mail size={16} className="text-gray-400 mr-3" />
              <span className="text-sm">{instructor.email}</span>
            </div>
            {instructor.phone && (
              <div className="flex items-center">
                <Phone size={16} className="text-gray-400 mr-3" />
                <span className="text-sm">{instructor.phone}</span>
              </div>
            )}
            {(instructor.joinDate || instructor.created_at) && (
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-3" />
                <span className="text-sm">
                  Joined {new Date(instructor.joinDate || instructor.created_at || '').toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Short Bio */}
          {instructor.bio && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-sm text-gray-600 line-clamp-3">
                {instructor.bio}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => onViewFullProfile(instructor.id)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              View Full Profile
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileModal;