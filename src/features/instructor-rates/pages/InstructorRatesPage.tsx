import React, { useState } from 'react';
import { useInstructorRates, RateWithInstructor } from '../hooks/useInstructorRates';
import { InstructorRateForm } from '../components/InstructorRateForm';
import { InstructorRate } from '../types/rate';
import { useAuth } from '../../auth/hooks/useAuth';

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Standard Rates</h1>
      <p className="text-gray-600 mb-6">Set generic rates by schedule type and category that can be applied to any instructor during class assignment.</p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{editingRate ? 'Edit Rate' : 'Add New Rate'}</h2>
        <InstructorRateForm onSubmit={handleSubmit} existingRate={editingRate} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Current Standard Rates</h2>
        <div className="grid gap-4">
          {rates.map((rate: RateWithInstructor) => (
            <div key={rate.id} className="p-4 border rounded-md flex justify-between items-center bg-white shadow-sm">
              <div>
                <p className="font-semibold text-lg">
                  {(rate as any).class_types ? `${(rate as any).class_types.name} (${(rate as any).class_types.difficulty_level})` : 
                   (rate as any).class_packages ? `${(rate as any).class_packages.name} (${(rate as any).class_packages.type})` : 'Generic'} - {' '}
                  {rate.schedule_type} - {' '}
                  {rate.category === 'individual' ? 'Individual' :
                   rate.category === 'corporate' ? 'Corporate' :
                   rate.category === 'private_group' ? 'Private Group' :
                   rate.category === 'public_group' ? 'Public Group' : rate.category}
                </p>
                <p className="text-gray-600 text-lg">
                  INR ₹{rate.rate_amount} {rate.rate_amount_usd ? `/ USD $${rate.rate_amount_usd}` : ''}
                </p>
                <p className="text-sm text-gray-500">
                  Effective from {new Date(rate.effective_from).toLocaleDateString()} 
                  {rate.effective_until ? ` to ${new Date(rate.effective_until).toLocaleDateString()}` : ' (No end date)'}
                  {rate.is_active ? ' • Active' : ' • Inactive'}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingRate(rate)}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded hover:bg-indigo-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteRate(rate.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-600 rounded hover:bg-red-50"
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
