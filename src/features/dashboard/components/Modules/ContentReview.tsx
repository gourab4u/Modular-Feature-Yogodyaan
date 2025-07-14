import { Eye } from 'lucide-react'

export function ContentReview() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Content Review</h2>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Content Review Dashboard
                    </h3>
                    <p className="text-gray-500">
                        Review and moderate user-generated content across the platform.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ContentReview