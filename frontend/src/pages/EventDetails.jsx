import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import EventCard from "../components/EventCard";
import EventMap from "../components/EventMap";
import {
  Clock, MapPin, Calendar, Users, IndianRupee, Share2, 
  ChevronDown, ChevronUp, Star, MessageSquare, Mic, 
  ExternalLink, Timer, Video, Edit, Radio, BarChart3,
  ArrowRight
} from "lucide-react";
import clsx from "clsx";

const generatePlaceholderUrl = (category, width = 1200, height = 600) => {
  const colors = {
    Technical: "6366f1", Cultural: "f43f5e", Sports: "10b981",
    Academic: "8b5cf6", Social: "f59e0b",
  };
  const color = colors[category] || "64748b";
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
    <div className="flex gap-4 justify-center">
      {[
        { val: timeLeft.days, label: "Days" },
        { val: timeLeft.hours, label: "Hours" },
        { val: timeLeft.minutes, label: "Min" },
        { val: timeLeft.seconds, label: "Sec" },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center text-2xl font-semibold text-brand-600 dark:text-brand-400 border border-border shadow-sm">
            {item.val.toString().padStart(2, "0")}
          </div>
          <span className="text-[10px] font-medium tracking-widest uppercase text-surface-500 mt-2">{item.label}</span>
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
          className={clsx(
            "w-5 h-5 transition-colors",
            star <= rating ? "text-amber-400 fill-amber-400" : "text-surface-300 dark:text-surface-700",
            interactive && "cursor-pointer hover:text-amber-300 hover:fill-amber-300"
          )}
          onClick={() => interactive && onRate(star)}
        />
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

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

        const allRes = await api.get("/events", {
          params: { category: eventRes.data.category },
        });
        setRelatedEvents(allRes.data.filter((e) => e._id !== id).slice(0, 3));
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
      setAvgRating((reviews.reduce((s, r) => s + r.rating, 0) + reviewForm.rating) / (reviews.length + 1));
      setReviewForm({ rating: 0, comment: "" });
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse">
        <div className="h-[60vh] bg-surface-200 dark:bg-surface-800 rounded-[2.5rem] mb-12"></div>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 bg-surface-200 dark:bg-surface-800 rounded-2xl w-3/4"></div>
            <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-full"></div>
            <div className="h-4 bg-surface-200 dark:bg-surface-800 rounded w-5/6"></div>
          </div>
          <div className="h-96 bg-surface-200 dark:bg-surface-800 rounded-[2rem]"></div>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-center py-32 text-red-500 font-medium">{error}</div>;
  if (!event) return <div className="text-center py-32 text-surface-500">Event not found.</div>;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isUpcoming = startTime > new Date();
  const isPast = endTime < new Date();
  const fillPercent = event.capacity > 0 ? Math.round(((event.capacity - event.seatsAvailable) / event.capacity) * 100) : 0;
  const eventImage = event.imageUrl || generatePlaceholderUrl(event.category, 1200, 600);

  const isStudent = user?.role === "student";
  const isOwnEvent = user && (event.organizer?._id === user.id || event.organizer === user.id || event.organizer?._id === user._id);
  const isOnline = event.eventMode === "online" || event.eventMode === "hybrid";
  const rolePrefix = user?.role === "admin" ? "/admin" : user?.role === "organizer" ? "/organizer" : "/student";
  const canGoLive = isOnline && isOwnEvent && new Date() >= new Date(new Date(event.startTime).getTime() - 15 * 60000) && new Date() <= new Date(event.endTime);
  const isLiveNow = isOnline && new Date() >= new Date(event.startTime) && new Date() <= new Date(event.endTime);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 transition-colors">
      
      {/* Hero Image */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="relative rounded-[2.5rem] overflow-hidden mb-12 lg:mb-16 border border-border shadow-elevated">
        <img src={eventImage} alt={event.title} className="w-full h-[50vh] sm:h-[60vh] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-surface-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-brand-500/90 backdrop-blur-md border border-brand-400/50 text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase">{event.category}</span>
            {event.price === 0 && <span className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400/50 text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase">FREE</span>}
            {isLiveNow && <span className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-md border border-red-400/50 text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</span>}
            {event.tags?.map((tag) => <span key={tag} className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs">{tag}</span>)}
          </div>
          <h1 className="font-semibold text-4xl sm:text-5xl lg:text-6xl font-normal text-white leading-tight text-balance max-w-4xl">
            {event.title}
          </h1>
        </div>

        <div className="absolute top-6 right-6 flex gap-3">
          <button onClick={handleShare} className="p-3 bg-surface-950/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-surface-950/60 transition-colors shadow-lg group">
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* Countdown */}
          {isUpcoming && !isLiveNow && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-[2rem] p-8 sm:p-10 flex flex-col items-center">
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-6 flex items-center gap-2 tracking-widest uppercase">
                <Timer className="w-4 h-4" /> Commencing in
              </p>
              <CountdownTimer targetDate={event.startTime} />
            </motion.div>
          )}

          {/* Description */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-6">About the Experience</h2>
            <div className="prose prose-surface dark:prose-invert prose-lg max-w-none text-surface-600 dark:text-surface-400 leading-relaxed text-balance">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          </motion.div>

          {/* Agenda */}
          {event.agenda?.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-8">Itinerary</h2>
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[4.5rem] sm:before:left-[5.5rem] before:w-px before:bg-border">
                {event.agenda.map((item, idx) => (
                  <div key={idx} className="relative flex gap-6 sm:gap-8 items-start">
                    <div className="w-16 sm:w-20 pt-1 text-right flex-shrink-0">
                      <span className="block text-sm font-semibold text-brand-600 dark:text-brand-400">{item.time}</span>
                      {item.duration && <span className="block text-xs text-surface-400 mt-1">{item.duration}</span>}
                    </div>
                    <div className="absolute left-[4.5rem] sm:left-[5.5rem] -translate-x-1/2 w-3 h-3 rounded-full bg-surface-50 dark:bg-surface-950 border-2 border-brand-500 mt-2 z-10" />
                    <div className="flex-1 bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-5 hover:border-brand-500/30 transition-colors">
                      <h4 className="text-base font-semibold text-surface-950 dark:text-surface-50 mb-1">{item.title}</h4>
                      {item.speaker && <p className="text-sm text-surface-500 flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> {item.speaker}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Speakers */}
          {event.speakers?.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-8">Featuring</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {event.speakers.map((speaker, idx) => (
                  <div key={idx} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2rem] p-6 flex flex-col gap-4 hover:shadow-surface transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center font-semibold text-2xl shadow-sm">
                        {speaker.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-surface-950 dark:text-surface-50">{speaker.name}</h4>
                        {speaker.role && <p className="text-sm text-brand-600 dark:text-brand-400">{speaker.role}</p>}
                      </div>
                    </div>
                    {speaker.bio && <p className="text-sm text-surface-500 leading-relaxed line-clamp-3">{speaker.bio}</p>}
                    {speaker.socialLink && (
                      <a href={speaker.socialLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-900 dark:text-surface-50 hover:text-brand-600 dark:hover:text-brand-400 mt-auto pt-2">
                        View Profile <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* FAQ */}
          {event.faqs?.length > 0 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-8">Common Questions</h2>
              <div className="space-y-3">
                {event.faqs.map((faq, idx) => (
                  <div key={idx} className="border border-border rounded-2xl overflow-hidden bg-surface-50 dark:bg-surface-900 transition-colors">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    >
                      <span className="font-medium text-surface-900 dark:text-surface-50 pr-4">{faq.question}</span>
                      <motion.div animate={{ rotate: openFaqIndex === idx ? 180 : 0 }}>
                        <ChevronDown className="w-5 h-5 text-surface-400" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaqIndex === idx && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-6 pb-5 pt-1 text-surface-600 dark:text-surface-400 leading-relaxed text-sm">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reviews */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="border-t border-border pt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50">
                Reflections <span className="text-surface-400 font-sans text-xl ml-2">({reviews.length})</span>
              </h2>
              {avgRating > 0 && (
                <div className="flex items-center gap-3 bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-full border border-border">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="font-semibold text-surface-900 dark:text-surface-50">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {isPast && user?.role === "student" && (
              <div className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2rem] p-6 sm:p-8 mb-8">
                <h4 className="font-medium text-surface-950 dark:text-surface-50 mb-4">Share your thoughts</h4>
                <div className="mb-4 inline-block bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-full border border-border">
                  <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} interactive />
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="How was your experience?"
                  rows={3}
                  className="w-full p-4 bg-surface-100 dark:bg-surface-950 border border-border text-surface-900 dark:text-white rounded-2xl text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none resize-none transition-all mb-4"
                />
                <button onClick={submitReview} disabled={reviewLoading} className="px-6 py-3 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 rounded-full font-medium text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {reviewLoading ? "Publishing..." : "Publish Reflection"}
                </button>
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center font-semibold text-lg">
                        {review.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-surface-50">{review.user?.name}</p>
                        <StarRating rating={review.rating} />
                      </div>
                      <span className="text-xs text-surface-400 ml-auto bg-surface-100 dark:bg-surface-800 px-3 py-1 rounded-full border border-border">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 border border-dashed border-border rounded-3xl bg-surface-50/50 dark:bg-surface-900/50">
                <MessageSquare className="w-8 h-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                <p className="text-surface-500">No reflections have been shared yet.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Info Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-surface-50 dark:bg-surface-900 border border-border rounded-[2.5rem] p-8 shadow-surface">
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 mb-1">Date</p>
                  <p className="font-medium text-surface-950 dark:text-surface-50">{startTime.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 mb-1">Time</p>
                  <p className="font-medium text-surface-950 dark:text-surface-50">{startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 mb-1">Location</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.fullAddress || event.venueName)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-surface-950 dark:text-surface-50 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {event.venueName}
                  </a>
                  {event.fullAddress && <p className="text-sm text-surface-500 mt-0.5">{event.fullAddress}</p>}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center flex-shrink-0">
                  <IndianRupee className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 mb-1">Access</p>
                  <p className="font-medium text-surface-950 dark:text-surface-50">{event.price > 0 ? `₹${event.price}` : "Complimentary"}</p>
                </div>
              </div>
            </div>

            {/* Registration Progress */}
            <div className="bg-surface-100 dark:bg-surface-950 rounded-2xl p-5 mb-8 border border-border">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <span className="block text-2xl font-semibold text-surface-950 dark:text-surface-50 leading-none mb-1">
                    {event.capacity - event.seatsAvailable}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                    Attending of {event.capacity}
                  </span>
                </div>
                <span className="text-sm font-bold text-surface-900 dark:text-surface-100 bg-surface-200 dark:bg-surface-800 px-2 py-1 rounded-md">{fillPercent}%</span>
              </div>
              <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-2 overflow-hidden">
                <div className={clsx("h-full transition-all duration-1000", fillPercent >= 90 ? "bg-rose-500" : fillPercent >= 60 ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${fillPercent}%` }} />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {isOwnEvent && (
                <>
                  <Link to={`/organizer/events/${id}/edit`} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:scale-[1.02] active:scale-95 transition-transform shadow-sm">
                    <Edit className="w-4 h-4" /> Orchestrate Event
                  </Link>
                  {canGoLive && (
                    <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
                      <Radio className="w-4 h-4" /> Initiate Live Stream
                    </Link>
                  )}
                </>
              )}

              {isStudent && !isOwnEvent && (
                <>
                  {isLiveNow && (
                    <Link to={`${rolePrefix}/events/${id}/live`} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm animate-pulse-slow">
                      <Radio className="w-4 h-4" /> Enter Live Stream
                    </Link>
                  )}
                  <Link to={`${rolePrefix}/explore`} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium bg-brand-600 text-white hover:bg-brand-500 transition-all hover:scale-[1.02] active:scale-95 shadow-glow">
                    {event.seatsAvailable > 0 ? "Secure Placement" : "Enter Waitlist"}
                  </Link>
                </>
              )}

              {!user && (
                <Link to="/login" className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:scale-[1.02] active:scale-95 transition-transform shadow-sm">
                  Sign in to register
                </Link>
              )}
            </div>

            {/* Organized by */}
            {event.organizer && (
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center font-semibold text-xl border border-border">
                  {event.organizer.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-surface-500 mb-0.5">Curated by</p>
                  <p className="font-semibold text-surface-950 dark:text-surface-50">{event.organizer.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-32 pt-16 border-t border-border">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50">Similar Experiences</h2>
            <Link to={`/explore?category=${event.category}`} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedEvents.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
