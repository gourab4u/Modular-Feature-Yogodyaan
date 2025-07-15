import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Award, Users, Heart, Target } from 'lucide-react';
export function About() {
    const values = [
        {
            icon: _jsx(Heart, { className: "w-8 h-8 text-emerald-600" }),
            title: "Compassion",
            description: "We approach every student with kindness, understanding, and patience on their unique journey."
        },
        {
            icon: _jsx(Target, { className: "w-8 h-8 text-emerald-600" }),
            title: "Excellence",
            description: "We strive for the highest standards in teaching, safety, and student experience."
        },
        {
            icon: _jsx(Users, { className: "w-8 h-8 text-emerald-600" }),
            title: "Community",
            description: "We foster a supportive, inclusive environment where everyone feels welcome and valued."
        },
        {
            icon: _jsx(Award, { className: "w-8 h-8 text-emerald-600" }),
            title: "Authenticity",
            description: "We honor traditional yoga practices while making them accessible to modern practitioners."
        }
    ];
    const instructors = [
        {
            name: "Priya Sharma",
            title: "Founder & Lead Instructor",
            experience: "15+ years",
            specialization: "Hatha & Vinyasa Yoga",
            image: "https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Priya founded Yogodyaan with a vision to make authentic yoga accessible to everyone. Trained in India and certified in multiple yoga styles."
        },
        {
            name: "David Thompson",
            title: "Senior Instructor",
            experience: "10+ years",
            specialization: "Power Yoga & Meditation",
            image: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "David brings a dynamic approach to yoga, combining strength-building poses with mindfulness practices for complete wellness."
        },
        {
            name: "Lisa Chen",
            title: "Wellness Coach",
            experience: "8+ years",
            specialization: "Restorative Yoga & Breathwork",
            image: "https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
            bio: "Lisa specializes in gentle, healing practices that help students find deep relaxation and stress relief through yoga."
        }
    ];
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx("section", { className: "gradient-bg text-white py-20", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "About Yogodyaan" }), _jsx("p", { className: "text-xl text-emerald-100", children: "Dedicated to spreading the transformative power of yoga and creating a community where everyone can find their path to wellness and inner peace." })] }) }), _jsx("section", { className: "py-20", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Our Story" }), _jsxs("div", { className: "space-y-4 text-gray-700", children: [_jsx("p", { children: "Yogodyaan was born from a simple belief: that yoga has the power to transform lives. Founded in 2015 by Priya Sharma, our studio began as a small space with big dreams of creating an inclusive, welcoming environment for yoga practitioners of all levels." }), _jsx("p", { children: "The word \"Yogodyaan\" combines \"Yoga\" with \"Daan\" (meaning gift or donation in Sanskrit), reflecting our mission to share the gift of yoga with our community. We believe that yoga is not just about physical postures, but a holistic practice that nurtures the mind, body, and spirit." }), _jsx("p", { children: "Today, we're proud to have helped thousands of students discover the joy and benefits of yoga. Our experienced instructors are passionate about guiding each student on their unique journey, whether they're complete beginners or advanced practitioners." })] })] }), _jsx("div", { children: _jsx("img", { src: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop", alt: "Yoga studio", className: "rounded-2xl shadow-lg" }) })] }) }) }), _jsx("section", { className: "py-20 bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Our Values" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "These core values guide everything we do and shape the experience we create for our students." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: values.map((value, index) => (_jsxs("div", { className: "card p-6 text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: value.icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: value.title }), _jsx("p", { className: "text-gray-600", children: value.description })] }, index))) })] }) }), _jsx("section", { className: "py-20", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Meet Our Instructors" }), _jsx("p", { className: "text-xl text-gray-600", children: "Our certified instructors bring years of experience and passion to every class." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: instructors.map((instructor, index) => (_jsxs("div", { className: "card p-6 text-center", children: [_jsx("img", { src: instructor.image, alt: instructor.name, className: "w-32 h-32 rounded-full mx-auto mb-4 object-cover" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-1", children: instructor.name }), _jsx("p", { className: "text-emerald-600 font-medium mb-2", children: instructor.title }), _jsx("div", { className: "text-sm text-gray-600 mb-4", children: _jsxs("p", { children: [instructor.experience, " \u2022 ", instructor.specialization] }) }), _jsx("p", { className: "text-gray-700", children: instructor.bio })] }, index))) })] }) }), _jsx("section", { className: "gradient-bg text-white py-20", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2", children: "5000+" }), _jsx("div", { className: "text-emerald-100", children: "Happy Students" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2", children: "50+" }), _jsx("div", { className: "text-emerald-100", children: "Classes per Week" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2", children: "9" }), _jsx("div", { className: "text-emerald-100", children: "Years of Experience" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-4xl font-bold mb-2", children: "15+" }), _jsx("div", { className: "text-emerald-100", children: "Certified Instructors" })] })] }) }) })] }));
}
