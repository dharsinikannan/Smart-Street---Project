import React, { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const StarRating = ({ rating, onChange, readOnly = false, size = "w-5 h-5" }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"} focus:outline-none`}
        >
          {star <= displayRating ? (
            <StarSolid className={`${size} text-yellow-400`} />
          ) : (
            <StarOutline className={`${size} text-gray-300 dark:text-gray-600`} />
          )}
        </button>
      ))}
    </div>
  );
};

export default StarRating;
