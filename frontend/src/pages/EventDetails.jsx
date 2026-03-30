import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import EventCard from "../components/EventCard";
import EventMap from "../components/EventMap";
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Share2,
  Tag,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
  Mic,
  ExternalLink,
  Timer,
  Video,
  Edit,
  Trash2,
  Radio,
  BarChart3,
  Megaphone,
  Download,
} from "lucide-react";

const generatePlaceholderUrl = (category, width = 800, height = 400) => {
  const colors = {
    Technical: "10B981", Cultural: "F59E0B", Sports: "EF4444",
    Academic: "6366F1", Social: "EC4899",
  };
  const color = colors[category] || "4B5563";
  return `https://placehold.co/${width}x${height}/${color}/FFFFFF?text=${encodeURIComponent((category || "EVENT").toUpperCase())}`;
};

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) return null;

  return (
    <div className="flex gap-3 justify-center">
      {[
        { val: timeLeft.days, label: "Days" },
        { val: timeLeft.hours, label: "Hours" },
        { val: timeLeft.minutes, label: "Min" },
        { val: timeLeft.seconds, label: "Sec" },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xl font-bold">
            {item.val}
          </div>
          <span className="text-xs text-gray-500 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating, onRate, interactive = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
          onClick={() => interactive && onRate(star)}
        />
      ))}
    </div>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [eventRes, reviewsRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/reviews/${id}`).catch(() => ({ data: { reviews: [], averageRating: 0 } })),
        ]);
        setEvent(eventRes.data);
        setReviews(reviewsRes.data.reviews);
        setAvgRating(reviewsRes.data.averageRating);

        // Fetch related events (same category)
        const allRes = await api.get("/events", {
          params: { category: eventRes.data.category },
        });
        setRelatedEvents(
          allRes.data.filter((e) => e._id !== id).slice(0, 3)
        );
      } catch (err) {
        setError("Could not load event details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const submitReview = async () => {
    if (reviewForm.rating === 0) return toast.error("Please select a rating");
    setReviewLoading(true);
    try {
      const res = await api.post(`/reviews/${id}`, reviewForm);
      setReviews((prev) => [res.data.review, ...prev]);
      setAvgRating(
        (reviews.reduce((s, r) => s + r.rating, 0) + reviewForm.rating) / (reviews.length + 1)
      );
      setReviewForm({ rating: 0, comment: "" });
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-72 bg-gray-200 rounded-xl"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  if (error) return <div className="text-center mt-12 text-red-600 font-semibold">{error}</div>;
  if (!event) return <div className="text-center mt-12">Event not found.</div>;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isUpcoming = startTime > new Date();
  const isPast = endTime < new Date();
  const fillPercent = event.capacity > 0 ? Math.round(((event.capacity - event.seatsAvailable) / event.capacity) * 100) : 0;
  const eventImage = event.imageUrl || generatePlaceholderUrl(event.category, 800, 400);

  const isStudent = user?.role === "student";
  const isOwnEvent = user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);
  const isOnline = event.eventMode === "online" || event.eventMode === "hybrid";
  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const canGoLive = isOnline && isOwnEvent && new Date() >= new Date(new Date(event.startTime).getTime() - 15 * 60000) && new Date() <= new Date(event.endTime);
  const isLiveNow = isOnline && new Date() >= new Date(event.startTime) && new Date() <= new Date(event.endTime);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Image */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <img src={eventImage} alt={event.title} className="w-full h-64 sm:h-80 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">{event.category}</span>
            {event.price === 0 && <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">FREE</span>}
            {event.tags?.map((tag) => <span key={tag} className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">{tag}</span>)}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h1>
        </div>
        <button onClick={handleShare} className="absolute top-4 right-4 p-2.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Countdown */}
          {isUpcoming && (
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-blue-600 mb-3 flex items-center justify-center gap-1">
                <Timer className="w-4 h-4" /> Event starts in
              </p>
              <CountdownTimer targetDate={event.startTime} />
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">About This Event</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{event.description}</p>
          </div>

          {/* Agenda */}
          {event.agenda?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Agenda</h2>
              <div className="space-y-3">
                {event.agenda.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-20 text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">{item.time}</span>
                      {item.duration && <p className="text-xs text-gray-400">{item.duration}</p>}
                    </div>
                    <div className="w-px bg-blue-200 self-stretch flex-shrink-0"></div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      {item.speaker && <p className="text-xs text-gray-500 mt-0.5">by {item.speaker}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speakers */}
          {event.speakers?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                <Mic className="w-5 h-5 inline mr-1" /> Speakers
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {event.speakers.map((speaker, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {speaker.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{speaker.name}</p>
                      {speaker.role && <p className="text-xs text-gray-500">{speaker.role}</p>}
                      {speaker.bio && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{speaker.bio}</p>}
                      {speaker.socialLink && (
                        <a href={speaker.socialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mt-1">
                          Profile <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {event.faqs?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">FAQ</h2>
              <div className="space-y-2">
                {event.faqs.map((faq, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                      {openFaqIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm font-medium text-gray-600">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Review Form (only for past events, logged-in students) */}
            {isPast && user?.role === "student" && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Write a review</p>
                <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} interactive />
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={2}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none resize-none"
                />
                <button
                  onClick={submitReview}
                  disabled={reviewLoading}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.user?.name}</p>
                        <StarRating rating={review.rating} />
                      </div>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Info Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 sticky top-20">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{startTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.fullAddress || event.venueName)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {event.venueName}
                  {event.fullAddress && <span className="block text-xs text-gray-500">{event.fullAddress}</span>}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <IndianRupee className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="font-semibold">{event.price > 0 ? `₹${event.price}` : "Free"}</span>
              </div>
            </div>

            {/* Registration Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  <Users className="w-4 h-4 inline mr-1" />
                  {event.capacity - event.seatsAvailable} / {event.capacity} registered
                </span>
                <span className="font-medium text-gray-900">{fillPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${fillPercent >= 90 ? "bg-red-500" : fillPercent >= 60 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {event.seatsAvailable > 0 ? `${event.seatsAvailable} spots left` : "Waitlist active"}
              </p>
            </div>

            {/* ===== ORGANIZER ACTIONS (own event) ===== */}
            {isOwnEvent && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manage Event</p>
                <Link to={`/organizer/events/${id}/edit`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  <Edit className="w-4 h-4" /> Edit Event
                </Link>
                {canGoLive && (
                  <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                    <Radio className="w-4 h-4" /> Go Live
                  </Link>
                )}
                {isLiveNow && !canGoLive && (
                  <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition">
                    <Radio className="w-4 h-4" /> Live Now — Join
                  </Link>
                )}
                <Link to="/organizer/analytics" className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                  <BarChart3 className="w-4 h-4" /> View Analytics
                </Link>
              </div>
            )}

            {/* ===== STUDENT ACTIONS ===== */}
            {isStudent && !isOwnEvent && (
              <div className="space-y-2">
                {/* Join Live */}
                {isLiveNow && (
                  <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                    <Radio className="w-4 h-4" /> Join Live Stream
                  </Link>
                )}

                {/* Join Online (upcoming) */}
                {isOnline && isUpcoming && !isLiveNow && (
                  <div className="text-center text-xs text-gray-500 py-2 bg-gray-50 rounded-xl">
                    <Video className="w-4 h-4 inline mr-1" /> Online event — join link available at start time
                  </div>
                )}

                {/* Watch Recording */}
                {event.streamConfig?.recordingUrl && isPast && (
                  <a href={event.streamConfig.recordingUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition">
                    <Video className="w-4 h-4" /> Watch Recording
                  </a>
                )}

                {/* Register */}
                <Link to={`${rolePrefix}/explore`} className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                  {event.seatsAvailable > 0 ? "Register Now" : "Join Waitlist"}
                </Link>
              </div>
            )}

            {/* ===== GUEST (not logged in) ===== */}
            {!user && (
              <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                Log in to Register
              </Link>
            )}

            {/* ===== NON-STUDENT, NON-OWNER (organizer viewing other's event) ===== */}
            {user && !isStudent && !isOwnEvent && (
              <div className="space-y-2">
                {isLiveNow && (
                  <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition">
                    <Radio className="w-4 h-4" /> Watch Live
                  </Link>
                )}
                <p className="text-xs text-gray-500 text-center">Viewing as {user.role}</p>
              </div>
            )}

            {/* Map */}
            {(event.fullAddress || event.venueName) && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Location</p>
                <EventMap
                  address={event.fullAddress || event.venueName}
                  venueName={event.venueName}
                  className="h-40 w-full rounded-lg overflow-hidden"
                />
              </div>
            )}

            {/* Organizer */}
            {event.organizer && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Organized by</p>
                <p className="text-sm font-semibold text-gray-900">{event.organizer.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Related Events</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
