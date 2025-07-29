import { Award, Heart, Target, Users } from 'lucide-react'

export function About() {
  const values = [
    {
      icon: <Heart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Compassion",
      description: "We approach every student with kindness, understanding, and patience on their unique journey."
    },
    {
      icon: <Target className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Excellence",
      description: "We strive for the highest standards in teaching, safety, and student experience."
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Community",
      description: "We foster a supportive, inclusive environment where everyone feels welcome and valued."
    },
    {
      icon: <Award className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Authenticity",
      description: "We honor traditional yoga practices while making them accessible to modern practitioners."
    }
  ]

  const instructors = [
    {
      name: "Bratati Batabyal",
      title: "Founder & Lead Instructor",
      experience: "5+ years",
      specialization: "Hatha & Vinyasa Yoga",
      image: "/images/pp_Bratati.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      bio: "Bratati founded Yogodyaan with a vision to make authentic yoga accessible to everyone. Trained in India and certified in multiple yoga styles."
    },
    {
      name: "Amita Agarwal",
      title: "Senior Instructor",
      experience: "6+ years",
      specialization: "Power Yoga & Meditation",
      image: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      bio: "Amita brings a dynamic approach to yoga, combining strength-building poses with mindfulness practices for complete wellness."
    },
    {
      name: "Lisa Chen",
      title: "Wellness Coach",
      experience: "8+ years",
      specialization: "Restorative Yoga & Breathwork",
      image: "https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
      bio: "Lisa specializes in gentle, healing practices that help students find deep relaxation and stress relief through yoga."
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">About Yogodyaan</h1>
          <p className="text-xl text-gray-600 dark:text-slate-300">
            Dedicated to spreading the transformative power of yoga and creating a community
            where everyone can find their path to wellness and inner peace.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Welcome to Yogodyaan – Breathe. Move. Transform.</h2>
              <div className="space-y-4 text-gray-700 dark:text-white text-lg">
                <p>
                  Founded by Ms. Bratati Batabyal in 2021, Yogodyaan is an all-online yoga platform empowering people to live healthier, more mindful lives through yoga.
                </p>
                <p>
                  We’ve trained 1000+ students in different parts of the world—offering accessible, expert-led sessions that blend ancient yogic wisdom with modern lifestyles.
                </p>
                <p>
                  From corporate wellness and chair yoga to programs for beginners and advanced practitioners, we’re here to help you de-stress, strengthen, and reconnect—wherever you are.
                </p>
                <p>
                  Join our growing community and take the first step toward a balanced, energized, and joyful life.
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="Yoga studio"
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
              These core values guide everything we do and shape the experience we create for our students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-slate-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Instructors</h2>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Our certified instructors bring years of experience and passion to every class.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {instructors.map((instructor, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                <img
                  src={instructor.image}
                  alt={instructor.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-slate-600"
                />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{instructor.name}</h3>
                <p className="text-emerald-500 dark:text-emerald-400 font-medium mb-2">{instructor.title}</p>
                <div className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  <p><span className="text-orange-500 dark:text-orange-400 font-semibold">{instructor.experience}</span> • <span className="text-blue-500 dark:text-blue-400 font-semibold">{instructor.specialization}</span></p>
                </div>
                <p className="text-gray-700 dark:text-white">{instructor.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-gray-900 dark:text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">1000+</div>
              <div className="text-gray-600 dark:text-slate-300">Happy Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">25+</div>
              <div className="text-gray-600 dark:text-slate-300">Classes per Week</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">5</div>
              <div className="text-gray-600 dark:text-slate-300">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">3+</div>
              <div className="text-gray-600 dark:text-slate-300">Certified Instructors</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}