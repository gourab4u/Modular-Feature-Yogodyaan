import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight, Award, Building, Globe, Target, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/Button';
export function Home() {
    const services = [
        {
            icon: _jsx(User, { className: "w-12 h-12 text-blue-600" }),
            title: "Personalized Online Coaching",
            description: "Individual attention, flexible scheduling, customized programs",
            features: ["1-on-1 sessions", "Personalized routines", "Flexible timing", "Progress tracking"],
            route: "/book/individual"
        },
        {
            icon: _jsx(Users, { className: "w-12 h-12 text-green-600" }),
            title: "Online Group Sessions",
            description: "Build consistency with like-minded professionals",
            features: ["Small group classes", "Community support", "Regular schedule", "Affordable pricing"],
            route: "/book-class"
        },
        {
            icon: _jsx(Building, { className: "w-12 h-12 text-purple-600" }),
            title: "Corporate Wellness Solutions",
            description: "Enhance team well-being and performance",
            features: ["Team sessions", "Workplace wellness", "Stress reduction", "Productivity boost"],
            route: "/book/corporate"
        }
    ];
    const benefits = [
        {
            icon: _jsx(Globe, { className: "w-8 h-8 text-blue-600" }),
            title: "Global Accessibility",
            description: "Join from anywhere in the world with just an internet connection"
        },
        {
            icon: _jsx(Building, { className: "w-8 h-8 text-green-600" }),
            title: "Corporate Wellness Focus",
            description: "Specialized programs designed for busy professionals"
        },
        {
            icon: _jsx(Target, { className: "w-8 h-8 text-purple-600" }),
            title: "Personalized Approach",
            description: "Customized sessions tailored to your specific needs and goals"
        },
        {
            icon: _jsx(Award, { className: "w-8 h-8 text-orange-600" }),
            title: "Professional Experience",
            description: "5+ years of expertise combining traditional practices with modern wellness"
        }
    ];
    const testimonials = [
        {
            name: "Sarah Johnson",
            position: "Marketing Director",
            location: "New York, USA",
            content: "Yogodyaan has transformed how our team approaches wellness. The corporate sessions have reduced stress and improved our overall productivity.",
            image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
        },
        {
            name: "Raj Patel",
            position: "Software Engineer",
            location: "Mumbai, India",
            content: "The personalized coaching sessions fit perfectly into my busy schedule. I've never felt more balanced and focused.",
            image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
        },
        {
            name: "Emily Chen",
            position: "Project Manager",
            location: "Singapore",
            content: "The group sessions create such a supportive community. It's amazing how we can connect with people from around the world.",
            image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
        }
    ];
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx("section", { className: "relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 lg:py-32", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("h1", { className: "text-4xl lg:text-6xl font-bold text-gray-900 leading-tight", children: ["Transform Your", _jsx("span", { className: "block text-blue-600", children: "Workplace, Mind," }), _jsx("span", { className: "block text-green-600", children: "and Body \u2014 Online" })] }), _jsx("p", { className: "text-xl text-gray-600 leading-relaxed", children: "Yogodyaan brings personalized corporate and wellness yoga programs to professionals worldwide. Experience the power of yoga from anywhere." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx(Link, { to: "/services", children: _jsx(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md", children: _jsxs("span", { className: "flex items-center whitespace-nowrap", children: ["Book Your Class", _jsx(ArrowRight, { className: "ml-2 w-5 h-5" })] }) }) }), _jsx(Link, { to: "/about", children: _jsx(Button, { variant: "outline", size: "lg", className: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg", children: "Learn More" }) })] }), _jsxs("div", { className: "flex items-center space-x-8 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "5+ Years Experience" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full" }), _jsx("span", { children: "Global Reach" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-purple-500 rounded-full" }), _jsx("span", { children: "Corporate Focus" })] })] })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "relative z-10", children: _jsx("img", { src: "public/images/Garudasana.png", alt: "Garudasana", className: "rounded-2xl shadow-2xl" }) }), _jsx("div", { className: "absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-blue-200 to-green-200 rounded-2xl -z-10" })] })] }) }) }), _jsx("section", { className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Our Services" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Choose the perfect yoga program that fits your lifestyle and goals" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: services.map((service, index) => (_jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200", children: [_jsx("div", { className: "flex justify-center mb-6", children: service.icon }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4 text-center", children: service.title }), _jsx("p", { className: "text-gray-600 mb-6 text-center", children: service.description }), _jsx("ul", { className: "space-y-2 mb-8", children: service.features.map((feature, idx) => (_jsxs("li", { className: "flex items-center text-gray-700", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full mr-3" }), feature] }, idx))) }), _jsx(Link, { to: service.route, children: _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300", children: "Book Your Class" }) })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-gray-50 to-blue-50", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: "https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&fit=crop", alt: "Yoga instructor", className: "rounded-2xl shadow-lg" }), _jsx("div", { className: "absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-lg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-3xl font-bold text-blue-600", children: "5+" }), _jsx("div", { className: "text-sm text-gray-600", children: "Years Experience" })] }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900", children: "Your Global Yoga Journey Starts Here" }), _jsxs("div", { className: "space-y-4 text-gray-700 leading-relaxed", children: [_jsx("p", { children: "With over 5 years of expertise combining traditional yoga practices with modern wellness needs, I specialize in bringing the transformative power of yoga to professionals worldwide." }), _jsx("p", { children: "My focus on online teaching and global reach ensures that distance is never a barrier to your wellness journey. Whether you're a busy executive in New York or a startup founder in Singapore, personalized yoga guidance is just a click away." }), _jsx("p", { children: "I believe that yoga is not just about physical postures\u2014it's about creating balance, reducing stress, and enhancing overall well-being in our fast-paced professional lives." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "text-center p-4 bg-white rounded-lg shadow-sm", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: "500+" }), _jsx("div", { className: "text-sm text-gray-600", children: "Global Students" })] }), _jsxs("div", { className: "text-center p-4 bg-white rounded-lg shadow-sm", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: "50+" }), _jsx("div", { className: "text-sm text-gray-600", children: "Corporate Programs" })] })] })] })] }) }) }), _jsx("section", { className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Why Choose Yogodyaan" }), _jsx("p", { className: "text-xl text-gray-600", children: "Experience the difference with our unique approach to online yoga" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", children: benefits.map((benefit, index) => (_jsxs("div", { className: "text-center p-6 rounded-xl hover:bg-gray-50 transition-all duration-300", children: [_jsx("div", { className: "flex justify-center mb-4", children: benefit.icon }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-3", children: benefit.title }), _jsx("p", { className: "text-gray-600", children: benefit.description })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-br from-blue-50 to-green-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "What Our Global Community Says" }), _jsx("p", { className: "text-xl text-gray-600", children: "Real stories from professionals who transformed their lives with Yogodyaan" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: testimonials.map((testimonial, index) => (_jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsx("img", { src: testimonial.image, alt: testimonial.name, className: "w-16 h-16 rounded-full mr-4 object-cover" }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900", children: testimonial.name }), _jsx("p", { className: "text-sm text-gray-600", children: testimonial.position }), _jsx("p", { className: "text-xs text-blue-600", children: testimonial.location })] })] }), _jsxs("p", { className: "text-gray-700 italic leading-relaxed", children: ["\"", testimonial.content, "\""] }), _jsx("div", { className: "flex text-yellow-400 mt-4", children: [...Array(5)].map((_, i) => (_jsx("span", { children: "\u2605" }, i))) })] }, index))) })] }) }), _jsx("section", { className: "py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white", children: _jsxs("div", { className: "max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8", children: [_jsx("h2", { className: "text-4xl font-bold mb-6", children: "Begin Your Wellness Journey" }), _jsx("p", { className: "text-xl mb-8 text-blue-100", children: "Join thousands of professionals worldwide who have discovered the transformative power of yoga. Schedule your first class today and take the first step towards a healthier, more balanced life." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Link, { to: "/services", children: _jsx(Button, { size: "lg", className: "bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-md", children: _jsxs("span", { className: "flex items-center whitespace-nowrap", children: ["Book Your Class", _jsx(ArrowRight, { className: "ml-2 w-5 h-5" })] }) }) }), _jsx(Link, { to: "/contact", children: _jsx(Button, { variant: "outline", size: "lg", className: "border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300", children: "Learn More" }) })] })] }) })] }));
}
