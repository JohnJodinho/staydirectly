import React from 'react';
import { Star } from 'lucide-react';

interface ReviewFallbackProps {
  className?: string;
}

const ReviewFallback: React.FC<ReviewFallbackProps> = ({ className = "" }) => {
  const sampleReviews = [
    {
      id: 1,
      author: "Sarah M.",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
      date: "March 2025",
      rating: 5,
      comment: "This property exceeded all our expectations. The location is perfect, just a few steps from the beach with incredible ocean views. The interior is beautifully designed with high-end finishes throughout. The host was very responsive and accommodating. We'll definitely be back next year!"
    },
    {
      id: 2,
      author: "James L.",
      avatar: "https://randomuser.me/api/portraits/men/54.jpg",
      date: "February 2025",
      rating: 5,
      comment: "Our stay at this gorgeous property was everything we hoped for and more. The kitchen is fully equipped for cooking any meal, and the outdoor grill area was perfect for evening cookouts. The beds were extremely comfortable, and the neighborhood is peaceful and quiet. Great value for such a luxurious stay."
    },
    {
      id: 3,
      author: "Elena K.",
      avatar: "https://randomuser.me/api/portraits/women/45.jpg",
      date: "February 2025",
      rating: 4,
      comment: "We had a wonderful family vacation at this property. The space is well-designed, clean, and very comfortable. The pool area was a hit with our kids. The only small issue was that the WiFi was a bit slow, but we were on vacation anyway! The location is convenient, close to restaurants and attractions."
    },
    {
      id: 4,
      author: "Michael T.",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      date: "January 2025",
      rating: 5,
      comment: "A fantastic place for our weekend getaway. The property is spotlessly clean with modern amenities. The fireplace in the living room created such a cozy atmosphere. The host's local recommendations were spot on - we discovered some amazing restaurants nearby. Check-in was seamless and communication was excellent."
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold">4.9</div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((num) => (
              <Star key={num} className="h-5 w-5 text-amber-500 fill-current" />
            ))}
          </div>
          <span className="text-gray-600 ml-2">· 84 reviews</span>
        </div>
        
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover-scale transition-all">
            Most recent
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover-scale transition-all">
            Highest rated
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-fade-in">
        {sampleReviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover-scale transition-all">
            <div className="flex justify-between mb-3">
              <div className="flex items-center">
                <img 
                  src={review.avatar} 
                  alt={review.author} 
                  className="w-10 h-10 rounded-full mr-3 object-cover" 
                />
                <div>
                  <h4 className="font-medium">{review.author}</h4>
                  <p className="text-gray-500 text-sm">{review.date}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-bold mr-1">{review.rating}.0</span>
                <Star className="h-4 w-4 text-amber-500 fill-current" />
              </div>
            </div>
            <p className="text-gray-600 text-sm line-clamp-4">{review.comment}</p>
            <button className="text-primary text-sm font-medium mt-2">Read more</button>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-8">
        <button className="px-6 py-2 border border-gray-800 rounded-lg font-medium hover:bg-gray-50 hover-scale btn-pulse">
          Show all 84 reviews
        </button>
      </div>
    </div>
  );
};

export default ReviewFallback;