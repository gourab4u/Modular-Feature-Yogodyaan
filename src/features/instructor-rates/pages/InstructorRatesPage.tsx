import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { InstructorRateForm } from '../components/InstructorRateForm';
import { RateWithInstructor, useInstructorRates } from '../hooks/useInstructorRates';
import { InstructorRate } from '../types/rate';

const InstructorRatesPage: React.FC = () => {
  const { user } = useAuth();
  const { rates, loading, error, addRate, updateRate, deleteRate } = useInstructorRates(user?.id);
  const [editingRate, setEditingRate] = useState<InstructorRate | undefined>(undefined);

  const handleSubmit = async (rateData: Omit<InstructorRate, 'id' | 'created_by'>) => {
    if (!user) {
      alert("You must be logged in to manage rates.");
      return;
    }

    if (editingRate) {
      await updateRate(editingRate.id, rateData);
    } else {
      await addRate(rateData);
    }
    setEditingRate(undefined);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold text-blue-800 mb-4">Manage Standard Rates</h1>
      <p className="text-gray-700 mb-6">Set generic rates by schedule type and category that can be applied to any instructor during class assignment.</p>

      <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">{editingRate ? 'Edit Rate' : 'Add New Rate'}</h2>
        <InstructorRateForm onSubmit={handleSubmit} existingRate={editingRate} />
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Current Standard Rates</h2>
        <div className="grid gap-6">
          {rates.map((rate: RateWithInstructor) => (
            <div key={rate.id} className="p-6 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50 hover:shadow-lg transition-shadow">
              <div>
                <p className="font-bold text-lg text-gray-800">
                  {(rate as any).class_types ? `${(rate as any).class_types.name} (${(rate as any).class_types.difficulty_level})` :
                    (rate as any).class_packages ? `${(rate as any).class_packages.name} (${(rate as any).class_packages.type})` : 'Generic'} - {' '}
                  {rate.schedule_type} - {' '}
                  {rate.category === 'individual' ? 'Individual' :
                    rate.category === 'corporate' ? 'Corporate' :
                      rate.category === 'private_group' ? 'Private Group' :
                        rate.category === 'public_group' ? 'Public Group' : rate.category}
                </p>
                <p className="text-gray-700 text-lg">
                  INR ₹{rate.rate_amount} {rate.rate_amount_usd ? `/ USD $${rate.rate_amount_usd}` : ''}
                </p>
                <p className="text-sm text-gray-600">
                  Effective from {new Date(rate.effective_from).toLocaleDateString()}
                  {rate.effective_until ? ` to ${new Date(rate.effective_until).toLocaleDateString()}` : ' (No end date)'}
                  {rate.is_active ? ' • Active' : ' • Inactive'}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingRate(rate)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteRate(rate.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {rates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rates configured yet. Add your first standard rate above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorRatesPage;
