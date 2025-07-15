import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Archive, Award, Edit, Eye, Plus, RotateCcw, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../../shared/lib/supabase';
export function ClassTypeManager() {
    const [classTypes, setClassTypes] = useState([]);
    const [archivedClassTypes, setArchivedClassTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingClassType, setEditingClassType] = useState(null);
    const [errors, setErrors] = useState({});
    const [activeTab, setActiveTab] = useState('active'); // ✅ Add tab state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        difficulty_level: 'beginner',
        price: 800, // ✅ Default to weekly classes for ₹800/month
        duration_minutes: 60,
        max_participants: 20,
        is_active: true,
        is_archived: false
    });
    const difficultyLevels = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];
    useEffect(() => {
        fetchClassTypes();
    }, []);
    const fetchClassTypes = async () => {
        try {
            setLoading(true);
            // Fetch active classes (not archived)
            const { data: activeData, error: activeError } = await supabase
                .from('class_types')
                .select('*')
                .eq('is_archived', false)
                .order('name');
            if (activeError)
                throw activeError;
            // Fetch archived classes
            const { data: archivedData, error: archivedError } = await supabase
                .from('class_types')
                .select('*')
                .eq('is_archived', true)
                .order('archived_at', { ascending: false });
            if (archivedError)
                throw archivedError;
            setClassTypes(activeData || []);
            setArchivedClassTypes(archivedData || []);
        }
        catch (error) {
            console.error('Error fetching class types:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim())
            newErrors.name = 'Name is required';
        if (!formData.description.trim())
            newErrors.description = 'Description is required';
        if (formData.price < 0)
            newErrors.price = 'Price cannot be negative';
        if (formData.duration_minutes < 15)
            newErrors.duration_minutes = 'Duration must be at least 15 minutes';
        if (formData.max_participants < 1)
            newErrors.max_participants = 'Max participants must be at least 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setSaving(true);
            if (editingClassType) {
                const { error } = await supabase
                    .from('class_types')
                    .update(formData)
                    .eq('id', editingClassType.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('class_types')
                    .insert([{ ...formData, is_archived: false }]);
                if (error)
                    throw error;
            }
            await fetchClassTypes();
            resetForm();
            alert(editingClassType ? 'Class type updated successfully!' : 'Class type created successfully!');
        }
        catch (error) {
            setErrors({ general: error.message });
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = (classType) => {
        setEditingClassType(classType);
        setFormData({ ...classType });
        setShowForm(true);
    };
    // ✅ Archive function instead of delete
    const handleArchive = async (id) => {
        if (!confirm('Are you sure you want to archive this class type? It will be moved to the archived section and all related schedules will be deactivated.'))
            return;
        try {
            setLoading(true);
            // Archive the class type
            const { error: classTypeError } = await supabase
                .from('class_types')
                .update({
                is_archived: true,
                is_active: false,
                archived_at: new Date().toISOString()
            })
                .eq('id', id);
            if (classTypeError)
                throw classTypeError;
            // Deactivate all related class schedules
            const { error: schedulesError } = await supabase
                .from('class_schedules')
                .update({
                is_active: false,
                effective_until: new Date().toISOString().split('T')[0]
            })
                .eq('class_type_id', id);
            if (schedulesError) {
                console.error('Error deactivating schedules:', schedulesError);
                // Continue anyway, class type is already archived
            }
            await fetchClassTypes();
            alert('Class type archived successfully!');
        }
        catch (error) {
            console.error('Error archiving class type:', error);
            alert(`Failed to archive class type: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    // ✅ Unarchive function to restore archived classes
    const handleUnarchive = async (id) => {
        if (!confirm('Are you sure you want to restore this class type from the archive?'))
            return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('class_types')
                .update({
                is_archived: false,
                is_active: true,
                archived_at: null
            })
                .eq('id', id);
            if (error)
                throw error;
            await fetchClassTypes();
            alert('Class type restored successfully!');
        }
        catch (error) {
            console.error('Error restoring class type:', error);
            alert(`Failed to restore class type: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            difficulty_level: 'beginner',
            price: 800, // ✅ Reset to default ₹800
            duration_minutes: 60,
            max_participants: 20,
            is_active: true,
            is_archived: false
        });
        setEditingClassType(null);
        setShowForm(false);
        setErrors({});
    };
    const getDifficultyColor = (level) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    // ✅ Helper function to format price in INR
    const formatPrice = (price) => {
        return `₹${price}`;
    };
    // ✅ Helper function to format archive date
    const formatArchiveDate = (dateString) => {
        if (!dateString)
            return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Award, { className: "w-6 h-6 mr-2" }), "Class Type Manager"] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsxs("button", { onClick: () => setActiveTab('active'), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'active'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`, children: ["Active Classes (", classTypes.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('archived'), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'archived'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'}`, children: [_jsx(Archive, { className: "w-4 h-4 mr-1 inline" }), "Archived (", archivedClassTypes.length, ")"] })] }), activeTab === 'active' && (_jsxs(Button, { onClick: () => setShowForm(true), className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Class Type"] }))] })] }), showForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: editingClassType ? 'Edit Class Type' : 'Add New Class Type' }), _jsx("button", { onClick: resetForm, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "e.g., Hatha Yoga, Vinyasa Flow" }), errors.name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description *" }), _jsx("textarea", { value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), rows: 3, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Describe the class style, benefits, and what students can expect" }), errors.description && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.description })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Difficulty Level *" }), _jsx("select", { value: formData.difficulty_level, onChange: (e) => handleInputChange('difficulty_level', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: difficultyLevels.map(level => (_jsx("option", { value: level.value, children: level.label }, level.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price (\u20B9) *" }), _jsx("input", { type: "number", value: formData.price, onChange: (e) => handleInputChange('price', parseFloat(e.target.value) || 0), min: "0", step: "1", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`, placeholder: "800" }), errors.price && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.price }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Weekly classes for \u20B9800/month" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Duration (minutes) *" }), _jsx("input", { type: "number", value: formData.duration_minutes, onChange: (e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0), min: "15", max: "180", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.duration_minutes ? 'border-red-500' : 'border-gray-300'}` }), errors.duration_minutes && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.duration_minutes })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max Participants *" }), _jsx("input", { type: "number", value: formData.max_participants, onChange: (e) => handleInputChange('max_participants', parseInt(e.target.value) || 0), min: "1", max: "50", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.max_participants ? 'border-red-500' : 'border-gray-300'}` }), errors.max_participants && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.max_participants })] }), _jsxs("div", { className: "flex items-center pt-6", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => handleInputChange('is_active', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-gray-900", children: "Active Class Type" })] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Cancel" }), _jsxs(Button, { type: "submit", loading: saving, className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : (editingClassType ? 'Update' : 'Create')] })] })] })] }) })), activeTab === 'active' && (_jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: classTypes.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Award, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No active class types" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first class type to get started." }), _jsxs(Button, { onClick: () => setShowForm(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Class Type"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6", children: classTypes.map((classType) => (_jsxs("div", { className: `border rounded-lg p-6 hover:shadow-md transition-shadow ${classType.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: classType.name }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEdit(classType), className: "text-blue-600 hover:text-blue-800 p-1", title: "Edit", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleArchive(classType.id), className: "text-orange-600 hover:text-orange-800 p-1", title: "Archive Class", children: _jsx(Archive, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: classType.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Difficulty:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`, children: classType.difficulty_level })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(classType.price) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsxs("span", { className: "text-sm", children: [classType.duration_minutes, " min"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Max Participants:" }), _jsx("span", { className: "text-sm", children: classType.max_participants })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${classType.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'}`, children: classType.is_active ? 'Active' : 'Inactive' })] })] }), classType.price === 800 && (_jsx("div", { className: "mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800", children: "\uD83D\uDCA1 Weekly classes for \u20B9800/month" }))] }, classType.id))) })) })), activeTab === 'archived' && (_jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: archivedClassTypes.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Archive, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No archived class types" }), _jsx("p", { className: "text-gray-600", children: "Archived class types will appear here for future reference." })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6", children: archivedClassTypes.map((classType) => (_jsxs("div", { className: "border border-orange-200 bg-orange-50 rounded-lg p-6 hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: classType.name }), _jsxs("p", { className: "text-xs text-orange-600 mt-1", children: ["\uD83D\uDCE6 Archived on ", formatArchiveDate(classType.archived_at)] })] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx("button", { onClick: () => handleEdit(classType), className: "text-blue-600 hover:text-blue-800 p-1", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleUnarchive(classType.id), className: "text-green-600 hover:text-green-800 p-1", title: "Restore from Archive", children: _jsx(RotateCcw, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: classType.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Difficulty:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getDifficultyColor(classType.difficulty_level)}`, children: classType.difficulty_level })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Price:" }), _jsx("span", { className: "font-semibold text-green-600", children: formatPrice(classType.price) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Duration:" }), _jsxs("span", { className: "text-sm", children: [classType.duration_minutes, " min"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Max Participants:" }), _jsx("span", { className: "text-sm", children: classType.max_participants })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: "px-2 py-1 rounded text-xs bg-orange-100 text-orange-800", children: "Archived" })] })] }), _jsx("div", { className: "mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800", children: "\uD83D\uDCE6 This class is archived. Click restore to make it active again." })] }, classType.id))) })) }))] }));
}
export default ClassTypeManager;
