import { Award, Building, CheckCircle, Clock, Globe, Heart, Target, User, Users } from 'lucide-react'

// Button component
const Button = ({ children, className = "", variant = "primary", size = "md", ...props }) => {
  const baseClasses = "font-semibold rounded-lg transition-all duration-300 cursor-pointer inline-block text-center"
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
  }
  const sizes = {
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg"
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// Link component
const Link = ({ to, children, className = "", ...props }) => {
  return (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  )
}

export function Services() {
  const services = [
    {
      icon: <User className="w-16 h-16 text-blue-600" />,
      title: "1-on-1 Coaching",
      subtitle: "Personalized Online Coaching",
      description: "Individual attention with flexible scheduling and customized programs tailored to your specific needs and goals.",
      features: [
        "Personalized yoga routines",
        "Flexible scheduling across time zones",
        "One-on-one attention and guidance",
        "Progress tracking and adjustments",
        "Customized meditation practices",
        "Injury modification and support"
      ],
      pricing: "From ₹375/session",
      duration: "60 minutes",
      ideal: "Busy professionals, beginners, specific health goals",
      bookingLink: "/book/individual"
    },
    {
      icon: <Users className="w-16 h-16 text-green-600" />,
      title: "Group Classes",
      subtitle: "Online Group Sessions",
      description: "Build consistency with like-minded professionals in small, intimate group settings. Perfect for teams or private groups seeking dedicated sessions.",
      features: [
        "Small group classes (max 8 people)",
        "Regular weekly schedule",
        "Community support and motivation",
        "Affordable pricing",
        "Interactive sessions with Q&A",
        "Progressive skill development"
      ],
      pricing: "From ₹125/session/person",
      duration: "45-60 minutes",
      ideal: "Team building, regular practice, community connection",
      bookingLink: "/book-class"
    },
    {
      icon: <Building className="w-16 h-16 text-purple-600" />,
      title: "Corporate Programs",
      subtitle: "Corporate Wellness Solutions",
      description: "Enhance team well-being and performance with specialized workplace wellness programs designed for modern organizations.",
      features: [
        "Team wellness sessions",
        "Stress reduction workshops",
        "Productivity enhancement programs",
        "Flexible corporate packages",
        "Employee wellness assessments",
        "Custom program development"
      ],
      pricing: "Custom packages available",
      duration: "30-90 minutes",
      ideal: "Companies, HR departments, team wellness initiatives",
      bookingLink: "/book/corporate"
    }
  ]

  const additionalServices = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Flexible Scheduling",
      description: "Sessions available across multiple time zones to accommodate global professionals"
    },
    {
      icon: <Globe className="w-8 h-8 text-green-600" />,
      title: "Global Accessibility",
      description: "Join from anywhere in the world with just a stable internet connection"
    },
    {
      icon: <Target className="w-8 h-8 text-purple-600" />,
      title: "Goal-Oriented Programs",
      description: "Customized programs designed to meet your specific wellness and fitness goals"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: "Holistic Wellness",
      description: "Comprehensive approach including physical postures, breathing, and meditation"
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Our Services</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Discover the yoga program that fits your lifestyle, schedule, and wellness goals.
            From personalized coaching to corporate wellness solutions.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {services.map((service, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center space-x-4">
                    {service.icon}
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{service.title}</h2>
                      <p className="text-lg text-gray-600">{service.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg leading-relaxed">{service.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Pricing:</span>
                      <span className="text-blue-600 font-bold">{service.pricing}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Duration:</span>
                      <span className="text-gray-700">{service.duration}</span>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-gray-900">Ideal for:</span>
                      <p className="text-gray-700 text-sm">{service.ideal}</p>
                    </div>
                  </div>

                  {service.title === "Group Classes" ? (
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm">
                        If you have a group and want to book a private session, use the button below.
                        To join our scheduled weekly classes, please check the class schedule.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to={service.bookingLink}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                            Book Group Session
                          </Button>
                        </Link>
                        <Link to="/schedule">
                          <Button variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300">
                            View Class Schedule
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Link to={service.bookingLink}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                        {service.title === "1-on-1 Coaching" ? "Book Individual Session" : "Book Corporate Program"}
                      </Button>
                    </Link>
                  )}
                </div>

                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="relative">
                    <img
                      src={`https://images.pexels.com/photos/${index === 0 ? '3822622' : index === 1 ? '3823495' : '3823488'}/pexels-photo-${index === 0 ? '3822622' : index === 1 ? '3823495' : '3823488'}.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop`}
                      alt={service.title}
                      className="rounded-2xl shadow-lg"
                    />
                    <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg">
                      <Award className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Services</h2>
            <p className="text-xl text-gray-600">
              Experience the difference with our comprehensive approach to online yoga
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalServices.map((service, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="flex justify-center mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Pricing Options</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for your schedule and budget
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">1-on-1 Coaching</h3>
                <div className="text-3xl font-bold text-blue-600 mb-2">From ₹375</div>
                <p className="text-gray-600 mb-4">per session</p>
                <Link to="/book/individual">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                    Book Individual
                  </Button>
                </Link>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Group Classes</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">From ₹125</div>
                <p className="text-gray-600 mb-4">per session / person</p>
                <Link to="/schedule">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
                    View Schedule
                  </Button>
                </Link>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Corporate Programs</h3>
                <div className="text-3xl font-bold text-purple-600 mb-2">Custom</div>
                <p className="text-gray-600 mb-4">packages available</p>
                <Link to="/book/corporate">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                    Book Corporate
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-700 mb-6">
                All sessions include personalized guidance, progress tracking, and ongoing support.
                Package deals and corporate discounts available.
              </p>
              <Link to="/contact">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
                  Get Custom Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Choose the service that best fits your needs and schedule your first session today.
            Transform your wellness routine with professional guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book/individual">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                Book Individual Session
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg">
                Ask Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}