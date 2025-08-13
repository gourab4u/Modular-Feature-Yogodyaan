import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useClassTypesAndPackages } from '../hooks/useClassTypesAndPackages';
import { CATEGORY_TYPES } from '../types/rate';
export const InstructorRateForm = ({ onSubmit, existingRate }) => {
    const { classTypes, packages, loading: dataLoading } = useClassTypesAndPackages();
    const [rateType, setRateType] = useState(existingRate?.class_type_id ? 'class_type' : 'package');
    const [classTypeId, setClassTypeId] = useState(existingRate?.class_type_id || '');
    const [packageId, setPackageId] = useState(existingRate?.package_id || '');
    const [scheduleType, setScheduleType] = useState(existingRate?.schedule_type || 'adhoc');
    const [category, setCategory] = useState(existingRate?.category || CATEGORY_TYPES[0]);
    // Auto-fill schedule type and category based on selection
    const handleClassTypeChange = (classTypeId) => {
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
    const handlePackageChange = (packageId) => {
        setPackageId(packageId);
        if (packageId) {
            const selectedPackage = packages.find(pkg => pkg.id === packageId);
            if (selectedPackage) {
                // Auto-fill based on package properties
                if (selectedPackage.course_type === 'crash') {
                    setScheduleType('crash');
                }
                else {
                    setScheduleType('package');
                }
                // Auto-fill category based on package type
                if (selectedPackage.type === 'Individual') {
                    setCategory('individual');
                }
                else if (selectedPackage.type === 'Corporate') {
                    setCategory('corporate');
                }
                else if (selectedPackage.type === 'Private group') {
                    setCategory('private_group');
                }
                else {
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
    const handleSubmit = (e) => {
        e.preventDefault();
        const rateData = {
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
        return _jsx("div", { className: "text-center py-4", children: "Loading class types and packages..." });
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Rate Type" }), _jsxs("div", { className: "flex space-x-4", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", value: "class_type", checked: rateType === 'class_type', onChange: (e) => setRateType(e.target.value), className: "mr-2" }), "Class Type"] }), _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", value: "package", checked: rateType === 'package', onChange: (e) => setRateType(e.target.value), className: "mr-2" }), "Package"] })] })] }), rateType === 'class_type' ? (_jsxs("div", { children: [_jsx("label", { htmlFor: "classTypeId", className: "block text-sm font-medium text-gray-700", children: "Class Type" }), _jsxs("select", { id: "classTypeId", value: classTypeId, onChange: (e) => handleClassTypeChange(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md", required: true, children: [_jsx("option", { value: "", children: "Select a class type" }), classTypes.map((classType) => (_jsxs("option", { value: classType.id, children: [classType.name, " - ", classType.difficulty_level, " (\u20B9", classType.price, ")"] }, classType.id)))] })] })) : (_jsxs("div", { children: [_jsx("label", { htmlFor: "packageId", className: "block text-sm font-medium text-gray-700", children: "Package" }), _jsxs("select", { id: "packageId", value: packageId, onChange: (e) => handlePackageChange(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md", required: true, children: [_jsx("option", { value: "", children: "Select a package" }), packages.map((pkg) => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.type, " (", pkg.class_count, " classes, \u20B9", pkg.price, ")"] }, pkg.id)))] })] })), _jsxs("div", { children: [_jsxs("label", { htmlFor: "scheduleType", className: "block text-sm font-medium text-gray-700", children: ["Schedule Type ", (classTypeId || packageId) && _jsx("span", { className: "text-blue-500 text-xs", children: "(Auto-filled)" })] }), _jsxs("select", { id: "scheduleType", value: scheduleType, onChange: (e) => setScheduleType(e.target.value), className: `mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${(classTypeId || packageId) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}`, disabled: !!(classTypeId || packageId), children: [_jsx("option", { value: "adhoc", children: "Ad-hoc / One-time" }), _jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "crash", children: "Crash Course" }), _jsx("option", { value: "package", children: "Package-based" })] })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "category", className: "block text-sm font-medium text-gray-700", children: ["Category ", packageId && _jsx("span", { className: "text-blue-500 text-xs", children: "(Auto-filled from package)" })] }), _jsx("select", { id: "category", value: category, onChange: (e) => setCategory(e.target.value), className: `mt-1 block w-full pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${packageId ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}`, disabled: !!packageId, children: CATEGORY_TYPES.map((type) => (_jsx("option", { value: type, children: type === 'individual' ? 'Individual' :
                                type === 'corporate' ? 'Corporate' :
                                    type === 'private_group' ? 'Private Group' :
                                        type === 'public_group' ? 'Public Group' : type }, type))) })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "rateAmount", className: "block text-sm font-medium text-gray-700", children: ["Rate Amount (INR) ", (classTypeId || packageId) && _jsxs("span", { className: "text-blue-500 text-xs", children: ["(Auto-filled from ", classTypeId ? 'class type' : 'package', " price)"] })] }), _jsx("input", { type: "number", id: "rateAmount", value: rateAmount, onChange: (e) => setRateAmount(parseFloat(e.target.value)), className: `mt-1 block w-full shadow-sm sm:text-sm rounded-md ${(classTypeId || packageId) ? 'bg-blue-50 border-blue-300' : 'border-gray-300'}`, required: true }), packageId && basePackagePrice > 0 && (_jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Suggested:" }), [25, 20, 15].map((pct) => {
                                const suggested = Math.round(basePackagePrice * (1 - pct / 100));
                                return (_jsxs("button", { type: "button", onClick: () => setRateAmount(suggested), className: "px-2.5 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200", title: `${pct}% below package price`, children: ["-", pct, "% (\u20B9", suggested, ")"] }, pct));
                            })] }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "rateAmountUsd", className: "block text-sm font-medium text-gray-700", children: "Rate Amount (USD)" }), _jsx("input", { type: "number", id: "rateAmountUsd", value: rateAmountUsd, onChange: (e) => setRateAmountUsd(parseFloat(e.target.value)), className: "mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "effectiveFrom", className: "block text-sm font-medium text-gray-700", children: "Effective From" }), _jsx("input", { type: "date", id: "effectiveFrom", value: effectiveFrom, onChange: (e) => setEffectiveFrom(e.target.value), className: "mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "effectiveUntil", className: "block text-sm font-medium text-gray-700", children: "Effective Until" }), _jsx("input", { type: "date", id: "effectiveUntil", value: effectiveUntil, onChange: (e) => setEffectiveUntil(e.target.value), className: "mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "isActive", type: "checkbox", checked: isActive, onChange: (e) => setIsActive(e.target.checked), className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "isActive", className: "ml-2 block text-sm text-gray-900", children: "Is Active" })] }), _jsx("button", { type: "submit", className: "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500", children: existingRate ? 'Update Rate' : 'Add Rate' })] }));
};
