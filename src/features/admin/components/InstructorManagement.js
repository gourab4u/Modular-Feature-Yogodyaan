import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Edit, GraduationCap, Plus, Save, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/ui/Button';
import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { supabase } from '../../../shared/lib/supabase';
export function InstructorManagement() {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        email: '',
        phone: '',
        specialties: [],
        experience_years: 0,
        certification: '',
        avatar_url: '',
        is_active: true
    });
    const [newSpecialty, setNewSpecialty] = useState('');
    const commonSpecialties = [
        'Hatha Yoga', 'Vinyasa Flow', 'Power Yoga', 'Restorative Yoga',
        'Yin Yoga', 'Ashtanga', 'Bikram', 'Hot Yoga', 'Prenatal Yoga',
        'Meditation', 'Breathwork', 'Yoga Therapy', 'Corporate Wellness'
    ];
    useEffect(() => {
        fetchInstructors();
    }, []);
    const fetchInstructors = async () => {
        try {
            setLoading(true);
            // First, get all user IDs with instructor or yoga_acharya roles
            const { data: userRoles, error: userRolesError } = await supabase
                .from('user_roles')
                .select(`
        user_id,
        roles!inner(name)
      `)
                .in('roles.name', ['instructor', 'yoga_acharya']);
            if (userRolesError)
                throw userRolesError;
            // Extract unique user IDs
            const instructorUserIds = [...new Set(userRoles?.map(ur => ur.user_id) || [])];
            if (instructorUserIds.length === 0) {
                setInstructors([]);
                return;
            }
            // Then fetch profiles for these users
            const { data, error: profileError } = await supabase
                .from('profiles')
                .select(`
        id, 
        user_id, 
        full_name, 
        email, 
        phone, 
        bio, 
        specialties, 
        experience_years, 
        certification, 
        avatar_url, 
        is_active
      `)
                .in('user_id', instructorUserIds)
                .order('full_name');
            if (profileError)
                throw profileError;
            console.log('📊 Raw instructor profiles:', data);
            // Filter and validate instructor profiles
            const validProfiles = (data || []).filter(profile => {
                const hasValidName = profile.full_name?.trim();
                const hasValidEmail = profile.email?.trim();
                const isValid = profile.user_id &&
                    (hasValidName || hasValidEmail);
                if (!isValid) {
                    console.warn('⚠️ Filtering out invalid instructor profile:', profile);
                }
                return isValid;
            });
            console.log('✅ Valid instructor profiles after filtering:', validProfiles);
            // Transform to Instructor interface
            const instructorData = validProfiles.map(profile => ({
                id: profile.id,
                user_id: profile.user_id,
                full_name: profile.full_name?.trim() || profile.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'Unknown Instructor',
                email: profile.email?.trim() || '',
                phone: profile.phone || '',
                bio: profile.bio || '',
                specialties: profile.specialties || [],
                experience_years: profile.experience_years || 0,
                certification: profile.certification || '',
                avatar_url: profile.avatar_url || '',
                is_active: profile.is_active ?? true
            }));
            console.log('📋 Final instructor data:', instructorData);
            setInstructors(instructorData);
        }
        catch (error) {
            console.error('❌ Error fetching instructors:', error);
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
    const handleAddSpecialty = () => {
        if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
            setFormData(prev => ({
                ...prev,
                specialties: [...prev.specialties, newSpecialty.trim()]
            }));
            setNewSpecialty('');
        }
    };
    const handleRemoveSpecialty = (specialtyToRemove) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.filter(specialty => specialty !== specialtyToRemove)
        }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.full_name.trim())
            newErrors.full_name = 'Full name is required';
        if (!formData.email.trim())
            newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = 'Invalid email format';
        if (!formData.bio.trim())
            newErrors.bio = 'Bio is required';
        if (formData.experience_years < 0)
            newErrors.experience_years = 'Experience years cannot be negative';
        if (formData.specialties.length === 0)
            newErrors.specialties = 'At least one specialty is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setSaving(true);
            if (editingInstructor) {
                // Update existing instructor profile
                const { error } = await supabase
                    .from('profiles')
                    .update({
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    bio: formData.bio,
                    specialties: formData.specialties,
                    experience_years: formData.experience_years,
                    certification: formData.certification,
                    avatar_url: formData.avatar_url,
                    is_active: formData.is_active
                })
                    .eq('id', editingInstructor.id);
                if (error)
                    throw error;
            }
            else {
                // Create new instructor: need to create user, profile, and assign role
                // First, create a new user account
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: formData.email,
                    email_confirm: true,
                    user_metadata: {
                        full_name: formData.full_name
                    }
                });
                if (authError)
                    throw authError;
                if (!authData.user)
                    throw new Error('Failed to create user');
                // Create profile for the new user
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        user_id: authData.user.id,
                        full_name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        bio: formData.bio,
                        specialties: formData.specialties,
                        experience_years: formData.experience_years,
                        certification: formData.certification,
                        avatar_url: formData.avatar_url,
                        is_active: formData.is_active
                    }])
                    .select()
                    .single();
                if (profileError)
                    throw profileError;
                // Get the instructor role ID
                const { data: roleData, error: roleError } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('name', 'instructor')
                    .single();
                if (roleError)
                    throw roleError;
                // Assign instructor role to the user
                const { error: userRoleError } = await supabase
                    .from('user_roles')
                    .insert([{
                        user_id: authData.user.id,
                        role_id: roleData.id
                    }]);
                if (userRoleError)
                    throw userRoleError;
            }
            await fetchInstructors();
            resetForm();
            alert(editingInstructor ? 'Instructor updated successfully!' : 'Instructor created successfully!');
        }
        catch (error) {
            console.error('Error saving instructor:', error);
            setErrors({ general: error.message });
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setFormData({ ...instructor });
        setShowForm(true);
    };
    const handleDelete = async (instructor) => {
        if (!confirm('Are you sure you want to remove instructor role from this user?'))
            return;
        try {
            // Get the instructor role ID
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', 'instructor')
                .single();
            if (roleError)
                throw roleError;
            // Remove the instructor role from the user
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', instructor.user_id)
                .eq('role_id', roleData.id);
            if (error)
                throw error;
            await fetchInstructors();
            alert('Instructor role removed successfully!');
        }
        catch (error) {
            console.error('Error removing instructor role:', error);
            alert('Failed to remove instructor role');
        }
    };
    const resetForm = () => {
        setFormData({
            full_name: '',
            bio: '',
            email: '',
            phone: '',
            specialties: [],
            experience_years: 0,
            certification: '',
            avatar_url: '',
            is_active: true
        });
        setEditingInstructor(null);
        setShowForm(false);
        setErrors({});
        setNewSpecialty('');
    };
    if (loading) {
        return (_jsx("div", { className: "flex justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(GraduationCap, { className: "w-6 h-6 mr-2" }), "Instructor Management"] }), _jsxs(Button, { onClick: () => setShowForm(true), className: "flex items-center", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Instructor"] })] }), showForm && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("div", { className: "p-6 border-b border-gray-200", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: editingInstructor ? 'Edit Instructor' : 'Add New Instructor' }), _jsx("button", { onClick: resetForm, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [errors.general && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3", children: _jsx("p", { className: "text-red-600 text-sm", children: errors.general }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), _jsx("input", { type: "text", value: formData.full_name, onChange: (e) => handleInputChange('full_name', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.full_name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Enter instructor's full name" }), errors.full_name && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.full_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "instructor@example.com", disabled: !!editingInstructor }), errors.email && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.email })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Phone" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "+1 (555) 123-4567" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Experience (Years)" }), _jsx("input", { type: "number", value: formData.experience_years, onChange: (e) => handleInputChange('experience_years', parseInt(e.target.value) || 0), min: "0", className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.experience_years ? 'border-red-500' : 'border-gray-300'}` }), errors.experience_years && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.experience_years })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Bio *" }), _jsx("textarea", { value: formData.bio, onChange: (e) => handleInputChange('bio', e.target.value), rows: 4, className: `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.bio ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Tell us about the instructor's background, teaching style, and philosophy" }), errors.bio && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.bio })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Certification" }), _jsx("input", { type: "text", value: formData.certification, onChange: (e) => handleInputChange('certification', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "e.g., RYT-200, RYT-500, E-RYT" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Avatar URL" }), _jsx("input", { type: "url", value: formData.avatar_url, onChange: (e) => handleInputChange('avatar_url', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "https://example.com/avatar.jpg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Specialties *" }), _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: formData.specialties.map((specialty, index) => (_jsxs("span", { className: "bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center", children: [specialty, _jsx("button", { type: "button", onClick: () => handleRemoveSpecialty(specialty), className: "ml-2 text-blue-600 hover:text-blue-800", children: _jsx(X, { className: "w-3 h-3" }) })] }, index))) }), _jsxs("div", { className: "flex gap-2 mb-3", children: [_jsx("input", { type: "text", value: newSpecialty, onChange: (e) => setNewSpecialty(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty()), className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Add a specialty" }), _jsx(Button, { type: "button", onClick: handleAddSpecialty, variant: "outline", size: "sm", children: "Add" })] }), _jsx("div", { className: "text-sm text-gray-600 mb-2", children: "Quick add:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: commonSpecialties.map((specialty) => (_jsx("button", { type: "button", onClick: () => {
                                                    if (!formData.specialties.includes(specialty)) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            specialties: [...prev.specialties, specialty]
                                                        }));
                                                    }
                                                }, className: `px-2 py-1 text-xs rounded border transition-colors ${formData.specialties.includes(specialty)
                                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`, disabled: formData.specialties.includes(specialty), children: specialty }, specialty))) }), errors.specialties && _jsx("p", { className: "text-red-500 text-sm mt-1", children: errors.specialties })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => handleInputChange('is_active', e.target.checked), className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-gray-900", children: "Active Instructor" })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: resetForm, children: "Cancel" }), _jsxs(Button, { type: "submit", loading: saving, className: "flex items-center", children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), saving ? 'Saving...' : (editingInstructor ? 'Update' : 'Create')] })] })] })] }) })), _jsx("div", { className: "bg-white rounded-xl shadow-lg overflow-hidden", children: instructors.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(GraduationCap, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No instructors yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Add your first instructor to get started." }), _jsxs(Button, { onClick: () => setShowForm(true), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add Instructor"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6", children: instructors.map((instructor) => (_jsxs("div", { className: `border rounded-lg p-6 hover:shadow-md transition-shadow ${instructor.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [instructor.avatar_url ? (_jsx("img", { src: instructor.avatar_url, alt: instructor.full_name, className: "w-12 h-12 rounded-full object-cover", onError: (e) => {
                                                    e.currentTarget.style.display = 'none';
                                                } })) : (_jsx("div", { className: "w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center", children: _jsx(User, { className: "w-6 h-6 text-gray-400" }) })), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: instructor.full_name }), instructor.certification && (_jsxs("p", { className: "text-sm text-blue-600 flex items-center", children: [_jsx(Award, { className: "w-3 h-3 mr-1" }), instructor.certification] }))] })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleEdit(instructor), className: "text-blue-600 hover:text-blue-800 p-1", title: "Edit", children: _jsx(Edit, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(instructor), className: "text-red-600 hover:text-red-800 p-1", title: "Remove Instructor Role", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4 line-clamp-3", children: instructor.bio }), _jsxs("div", { className: "space-y-2 mb-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Experience:" }), _jsxs("span", { className: "text-sm font-medium", children: [instructor.experience_years, " years"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Email:" }), _jsx("span", { className: "text-sm", children: instructor.email })] }), instructor.phone && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Phone:" }), _jsx("span", { className: "text-sm", children: instructor.phone })] })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Status:" }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${instructor.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'}`, children: instructor.is_active ? 'Active' : 'Inactive' })] })] }), instructor.specialties.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Specialties:" }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [instructor.specialties.slice(0, 3).map((specialty, index) => (_jsx("span", { className: "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs", children: specialty }, index))), instructor.specialties.length > 3 && (_jsxs("span", { className: "text-gray-500 text-xs", children: ["+", instructor.specialties.length - 3, " more"] }))] })] }))] }, instructor.id))) })) })] }));
}
