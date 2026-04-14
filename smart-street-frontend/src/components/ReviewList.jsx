import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import Skeleton from './Skeleton';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const ReviewList = ({ vendorId, onReviewAdded }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  
  // New Review State
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/${vendorId}`);
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [vendorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRating === 0) return setError("Please select a rating");
    
    setSubmitting(true);
    setError("");

    try {
      await api.post('/reviews', { vendorId, rating: newRating, comment });
      setNewRating(0);
      setComment("");
      await fetchReviews(); // Refresh list
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="text-center">
           <div className="text-3xl font-bold text-slate-800 dark:text-white">
             {Number(stats.average_rating || 0).toFixed(1)}
           </div>
           <StarRating rating={Math.round(stats.average_rating || 0)} readOnly size="w-3 h-3" />
           <div className="text-xs text-slate-500 mt-1">{stats.total_reviews} reviews</div>
        </div>
        <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
           Customer reviews build trust. See what others are saying about this vendor.
        </div>
      </div>

      {/* Write Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h4 className="font-semibold text-sm mb-3">Write a Review</h4>
          <div className="mb-3">
            <StarRating rating={newRating} onChange={setNewRating} size="w-6 h-6" />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
            rows="3"
          />
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <button 
            type="submit" 
            disabled={submitting || newRating === 0}
            className="mt-3 w-full bg-cyan-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Post Review"}
          </button>
        </form>
      ) : (
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-sm text-slate-500">Please <Link to="/login" className="text-cyan-600 underline">login</Link> or <Link to="/register" className="text-cyan-600 underline">sign up</Link> to write a review.</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton variant="circular" className="w-8 h-8" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full ml-10" />
                <Skeleton className="h-4 w-3/4 ml-10 mt-1" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-slate-400 text-sm">No reviews yet. Be the first!</p>
        ) : (
          reviews.map(review => (
            <div key={review.review_id} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="w-8 h-8 text-slate-300" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{review.user_name}</p>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        review.user_role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                        review.user_role === 'VENDOR' ? 'bg-blue-100 text-blue-600' :
                        review.user_role === 'OWNER' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {review.user_role === 'USER' ? 'Citizen' : review.user_role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <StarRating rating={review.rating} readOnly size="w-3 h-3" />
                       <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 pl-10">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;
