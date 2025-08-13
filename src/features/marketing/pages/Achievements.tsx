import { Award, Image as ImageIcon } from 'lucide-react'

export function Achievements() {
    // Example media data; replace with your real achievements/photos
    const achievements = [
        {
            title: "International Yoga Day 2023",
            description: "Hosted a global online session with 1000+ participants.",
            image: "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        {
            title: "Corporate Wellness Award",
            description: "Recognized for excellence in workplace wellness programs.",
            image: "https://images.pexels.com/photos/3823488/pexels-photo-3823488.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        {
            title: "Community Outreach",
            description: "Free yoga classes for underprivileged communities.",
            image: "https://images.pexels.com/photos/3823495/pexels-photo-3823495.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
        },
        // Add more as needed
    ]

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="gradient-bg text-white py-20">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <Award className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="text-5xl font-bold mb-6">Our Achievements</h1>
                    <p className="text-xl text-emerald-100">
                        Celebrating milestones and sharing moments from our journey to inspire wellness worldwide.
                    </p>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h2>
                        <p className="text-xl text-gray-600">
                            Explore highlights from our events, awards, and community impact.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {achievements.map((item, idx) => (
                            <div key={idx} className="card p-0 overflow-hidden group">
                                <div className="relative h-64 bg-gray-100 flex items-center justify-center">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <ImageIcon className="w-16 h-16 text-gray-300" />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-gray-700">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Achievements