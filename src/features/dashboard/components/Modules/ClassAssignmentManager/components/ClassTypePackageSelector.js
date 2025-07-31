import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ClassTypePackageSelector = ({ formData, classTypes, packages, onInputChange, errors }) => {
    // Don't show for template assignments
    if (formData.assignment_type === 'weekly' && formData.selected_template_id) {
        return null;
    }
    const showPackageSelector = ['crash_course', 'monthly', 'package'].includes(formData.assignment_type);
    const showClassTypeSelector = !showPackageSelector;
    const getLabel = () => {
        switch (formData.assignment_type) {
            case 'crash_course':
                return 'Crash Course Package';
            case 'monthly':
                return 'Regular Package';
            case 'package':
                return 'Package';
            default:
                return 'Class Type';
        }
    };
    const getFilteredPackages = () => {
        switch (formData.assignment_type) {
            case 'crash_course':
                return packages.filter(p => p.course_type === 'crash');
            case 'monthly':
            case 'package':
                return packages.filter(p => p.course_type === 'regular');
            default:
                return packages;
        }
    };
    return (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700", children: [getLabel(), _jsx("span", { className: "text-red-500", children: " *" })] }), showClassTypeSelector && (_jsxs("select", { value: formData.class_type_id, onChange: (e) => {
                    onInputChange('class_type_id', e.target.value);
                    onInputChange('package_id', ''); // Clear package_id when using class type
                }, className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select Class Type" }), classTypes.map(classType => (_jsxs("option", { value: classType.id, children: [classType.name, " (", classType.difficulty_level, ")"] }, classType.id)))] })), showPackageSelector && (_jsxs("select", { value: formData.package_id, onChange: (e) => {
                    onInputChange('package_id', e.target.value);
                    onInputChange('class_type_id', ''); // Clear class_type_id when using package
                }, className: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "Select Package" }), getFilteredPackages().map(pkg => (_jsxs("option", { value: pkg.id, children: [pkg.name, " - ", pkg.class_count, " classes ($", pkg.price, ")"] }, pkg.id)))] })), errors.class_type_id && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.class_type_id })), errors.package_id && (_jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.package_id })), formData.package_id && showPackageSelector && (_jsx("div", { className: "mt-2 p-2 bg-blue-50 rounded border", children: (() => {
                    const selectedPackage = packages.find(p => p.id === formData.package_id);
                    if (!selectedPackage)
                        return null;
                    return (_jsxs("div", { className: "text-sm text-blue-800", children: [_jsx("p", { children: _jsx("strong", { children: selectedPackage.name }) }), _jsx("p", { children: selectedPackage.description }), _jsxs("p", { children: ["Duration: ", selectedPackage.duration] }), _jsxs("p", { children: ["Classes: ", selectedPackage.class_count] }), _jsxs("p", { children: ["Price: $", selectedPackage.price] }), selectedPackage.validity_days && (_jsxs("p", { children: ["Valid for: ", selectedPackage.validity_days, " days"] }))] }));
                })() }))] }));
};
