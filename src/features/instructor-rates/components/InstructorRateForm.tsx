import React, { useState } from 'react';
import { useClassTypesAndPackages } from '../hooks/useClassTypesAndPackages';
import { CATEGORY_TYPES, InstructorRate } from '../types/rate';

interface InstructorRateFormProps {
  onSubmit: (rate: Omit<InstructorRate, 'id' | 'created_by'>) => void;
  existingRate?: InstructorRate;
}

export const InstructorRateForm: React.FC<InstructorRateFormProps> = ({ onSubmit, existingRate }) => {
  const { classTypes, packages, loading: dataLoading } = useClassTypesAndPackages();

  const [rateType, setRateType] = useState<'class_type' | 'package'>(
    existingRate?.class_type_id ? 'class_type' : 'package'
  );
  const [classTypeId, setClassTypeId] = useState(existingRate?.class_type_id || '');
  const [packageId, setPackageId] = useState(existingRate?.package_id || '');
  const [scheduleType, setScheduleType] = useState(existingRate?.schedule_type || 'adhoc');
  const [category, setCategory] = useState(existingRate?.category || CATEGORY_TYPES[0]);

  // Auto-fill schedule type and category based on selection
  const handleClassTypeChange = (classTypeId: string) => {
    setClassTypeId(classTypeId);
    if (classTypeId) {
      const selectedClassType = classTypes.find(ct => ct.id === classTypeId);
      // For class types, typically adhoc or weekly
      setScheduleType('adhoc');
      setCategory('individual'); // Default for class types

      // Auto-fill rate amount from class type price
      if (selectedClassType) {
        setRateAmount(selectedClassType.price);
      }
    }
  };

  const handlePackageChange = (packageId: string) => {
    setPackageId(packageId);
    if (packageId) {
      const selectedPackage = packages.find(pkg => pkg.id === packageId);
      if (selectedPackage) {
        // Auto-fill based on package properties
        if (selectedPackage.course_type === 'crash') {
          setScheduleType('crash');
        } else {
          setScheduleType('package');
        }

        // Auto-fill category based on package type
        if (selectedPackage.type === 'Individual') {
          setCategory('individual');
        } else if (selectedPackage.type === 'Corporate') {
          setCategory('corporate');
        } else if (selectedPackage.type === 'Private group') {
          setCategory('private_group');
        } else {
          setCategory('public_group');
        }

        // Auto-fill rate amount from package price
        setRateAmount(selectedPackage.price);
      }
    }
  };
  const [rateAmount, setRateAmount] = useState(existingRate?.rate_amount || 0);
  const [rateAmountUsd, setRateAmountUsd] = useState(existingRate?.rate_amount_usd || 0);
  const [effectiveFrom, setEffectiveFrom] = useState(existingRate?.effective_from || new Date().toISOString().split('T')[0]);
  const [effectiveUntil, setEffectiveUntil] = useState(existingRate?.effective_until || '');
  const [isActive, setIsActive] = useState(existingRate?.is_active ?? true);

  // Base package price for suggestions (when a package is selected)
  const selectedPackageForSuggestions = packages.find((pkg) => pkg.id === packageId);
  const basePackagePrice = selectedPackageForSuggestions?.price || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateData: Omit<InstructorRate, 'id' | 'created_by'> = {
      class_type_id: rateType === 'class_type' ? classTypeId : undefined,
      package_id: rateType === 'package' ? packageId : undefined,
      schedule_type: scheduleType,
      category,
      rate_amount: rateAmount,
      rate_amount_usd: rateAmountUsd,
      effective_from: effectiveFrom,
      ...(effectiveUntil ? { effective_until: effectiveUntil } : {}),
      is_active: isActive,
    };
    onSubmit(rateData);
  };

  if (dataLoading) {
    return <div className="text-center py-4">Loading class types and packages...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rate Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="class_type"
              checked={rateType === 'class_type'}
              onChange={(e) => setRateType(e.target.value as 'class_type')}
              className="mr-2"
            />
            Class Type
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="package"
              checked={rateType === 'package'}
              onChange={(e) => setRateType(e.target.value as 'package')}
              className="mr-2"
            />
            Package
          </label>
        </div>
      </div>

      {/* Class Type or Package Selection */}
      {rateType === 'class_type' ? (
        <div>
          <label htmlFor="classTypeId" className="block text-sm font-medium text-gray-700">
            Class Type
          </label>
          <select
            id="classTypeId"
            value={classTypeId}
            onChange={(e) => handleClassTypeChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a class type</option>
            {classTypes.map((classType) => (
              <option key={classType.id} value={classType.id}>
                {classType.name} - {classType.difficulty_level} (₹{classType.price})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor="packageId" className="block text-sm font-medium text-gray-700">
            Package
          </label>
          <select
            id="packageId"
            value={packageId}
            onChange={(e) => handlePackageChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a package</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - {pkg.type} ({pkg.class_count} classes, ₹{pkg.price})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="scheduleType" className="block text-sm font-medium text-gray-700">
          Schedule Type {(classTypeId || packageId) && <span className="text-blue-500 text-xs">(Auto-filled)</span>}
        </label>
        <select
          id="scheduleType"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${(classTypeId || packageId) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
            }`}
          disabled={!!(classTypeId || packageId)}
        >
          <option value="adhoc">Ad-hoc / One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="crash">Crash Course</option>
          <option value="package">Package-based</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category {packageId && <span className="text-blue-500 text-xs">(Auto-filled from package)</span>}
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${packageId ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
            }`}
          disabled={!!packageId}
        >
          {CATEGORY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'individual' ? 'Individual' :
                type === 'corporate' ? 'Corporate' :
                  type === 'private_group' ? 'Private Group' :
                    type === 'public_group' ? 'Public Group' : type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="rateAmount" className="block text-sm font-medium text-gray-700">
          Rate Amount (INR) {(classTypeId || packageId) && <span className="text-blue-500 text-xs">(Auto-filled from {classTypeId ? 'class type' : 'package'} price)</span>}
        </label>
        <input
          type="number"
          id="rateAmount"
          value={rateAmount}
          onChange={(e) => setRateAmount(parseFloat(e.target.value))}
          className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${(classTypeId || packageId) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
            }`}
          required
        />
        {packageId && basePackagePrice > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Suggested:</span>
            {([25, 20, 15] as const).map((pct) => {
              const suggested = Math.round(basePackagePrice * (1 - pct / 100));
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRateAmount(suggested)}
                  className="px-2.5 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  title={`${pct}% below package price`}
                >
                  -{pct}% (₹{suggested})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="rateAmountUsd" className="block text-sm font-medium text-gray-700">
          Rate Amount (USD)
        </label>
        <input
          type="number"
          id="rateAmountUsd"
          value={rateAmountUsd}
          onChange={(e) => setRateAmountUsd(parseFloat(e.target.value))}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label htmlFor="effectiveFrom" className="block text-sm font-medium text-gray-700">
          Effective From
        </label>
        <input
          type="date"
          id="effectiveFrom"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label htmlFor="effectiveUntil" className="block text-sm font-medium text-gray-700">
          Effective Until
        </label>
        <input
          type="date"
          id="effectiveUntil"
          value={effectiveUntil}
          onChange={(e) => setEffectiveUntil(e.target.value)}
          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        />
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          Is Active
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {existingRate ? 'Update Rate' : 'Add Rate'}
      </button>
    </form>
  );
};
