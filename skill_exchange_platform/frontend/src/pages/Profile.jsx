import React, { useEffect, useState } from "react";
import axios from "../api";
import { useAuth } from "../AuthContext";
import { formatReputation } from "../utils/formatReputation";
import PageContainer from "../components/ui/PageContainer";
import { Calendar, Star, TrendingUp, Edit3, Save, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", availability: "" });

  useEffect(() => {
    if (!user) {
      console.log("[PROFILE] Not logged in, skipping profile fetch");
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        console.log("[PROFILE] Fetching profile for user:", user.email);
        setLoading(true);
        const res = await axios.get("/profiles/me");
        console.log("[PROFILE] Profile fetched:", res.data);
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error("[PROFILE] Fetch error:", {
          status: err.response?.status,
          message: err.response?.data?.detail || err.message,
          user: user.email,
        });
        setError("Unable to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("[PROFILE] Updating profile:", form);
      const res = await axios.put("/profiles/me", form);
      console.log("[PROFILE] Profile updated:", res.data);
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      console.error("[PROFILE] Update error:", {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message,
      });
      const msg = err.response?.data?.detail || "Failed to update profile";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              View Your Profile
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Log in to manage your profile and connect with others
            </p>
            <a
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Log In to Continue
            </a>
          </div>
        </div>
      </PageContainer>
    );
  }

  const initial = profile?.name?.charAt(0)?.toUpperCase() || "U";
  const reputationScore = profile?.reputation || 0;
  const totalRatings = profile?.total_ratings || 0;
  const availability = profile?.availability || "Not specified";

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your professional information and availability
          </p>
        </div>
        {profile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
          >
            <Edit3 size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-900 text-sm">{error}</p>
          </div>
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          {!editing ? (
            <>
              {/* Hero Profile Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex justify-center text-center align-middle relative h-20 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700">
                  {
                    <h1 className="mt-3.5 text-4xl md:text-4xl font-bold text-white tracking-wide">
                      Hello,{" "}
                      <span className="font-extrabold">{profile.name}</span>
                    </h1>
                  }
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    }}
                  ></div>
                </div>

                <div className="px-6 pt-8 pb-6">
                  {/* Profile Info Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white ring-1 ring-indigo-200">
                        {initial}
                      </div>
                    </div>

                    {/* Name & Email */}
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-3xl font-bold text-gray-900 mb-1">
                        {profile.name}
                      </h2>
                      <p className="text-gray-600 text-base">{profile.email}</p>
                    </div>

                    {/* Mobile Edit Button */}
                    <button
                      onClick={() => setEditing(true)}
                      className="sm:hidden w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Availability Card */}
                    <div className="group bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-default">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                          Availability
                        </h3>
                        <Calendar size={16} className="text-blue-400" />
                      </div>
                      <p className="text-gray-900 font-semibold line-clamp-2">
                        {availability}
                      </p>
                      <div className="mt-2 h-1 bg-blue-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Reputation Card */}
                    <div className="group bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-100 rounded-xl p-4 hover:border-amber-200 hover:shadow-md transition-all duration-300 cursor-default">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                          Reputation
                        </h3>
                        <Star size={16} className="text-amber-400" />
                      </div>
                      <p className="text-gray-900 font-semibold">
                        {formatReputation(reputationScore, totalRatings)}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        Based on {totalRatings}{" "}
                        {totalRatings === 1 ? "rating" : "ratings"}
                      </div>
                      <div className="mt-2 h-1 bg-amber-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Total Ratings Card */}
                    <div className="group bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-md transition-all duration-300 cursor-default">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                          Total Ratings
                        </h3>
                        <TrendingUp size={16} className="text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">
                        {totalRatings}
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        Community reviews
                      </div>
                      <div className="mt-2 h-1 bg-emerald-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional: Bio Section (if exists) */}
              {profile.bio && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </>
          ) : (
            /* Edit Form */
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setEditing(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="your@email.com"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your contact information
                  </p>
                </div>

                {/* Availability Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Availability
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="e.g., Weekdays 9-5 PM, Weekends flexible, Best contact: Email"
                    rows="3"
                    value={form.availability}
                    onChange={(e) =>
                      setForm({ ...form, availability: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Let others know when you're available
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
