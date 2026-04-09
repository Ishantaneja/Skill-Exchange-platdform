import React, { useEffect, useState } from "react";
import axios from "../api";
import { useAuth } from "../AuthContext";
import SendRequestModal from "../components/SendRequestModal";
import PageContainer from "../components/ui/PageContainer";
import { formatReputation } from "../utils/formatReputation";
import { MoreVertical } from "lucide-react";

export default function Skills() {
  const { user, token } = useAuth();
  const [skills, setSkills] = useState([]);
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [search, setSearch] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestingSkill, setRequestingSkill] = useState(null); // skill to request
  const [reqLoading, setReqLoading] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState("");
  const [openMenuSkillId, setOpenMenuSkillId] = useState("");

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedInsideMenu = event.target.closest("[data-skill-menu-root]");
      if (!clickedInsideMenu) {
        setOpenMenuSkillId("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("[SKILLS] Fetching skills...");
      const res = await axios.get("/skills", { params: { name: search } });
      console.log("[SKILLS] Fetched:", res.data.length, "skills");
      setSkills(res.data);

      const ownerIds = [
        ...new Set(res.data.map((s) => s.owner_id).filter(Boolean)),
      ];
      if (ownerIds.length > 0) {
        const profileResults = await Promise.all(
          ownerIds.map(async (ownerId) => {
            try {
              const profileRes = await axios.get(`/profiles/${ownerId}`);
              return [ownerId, profileRes.data];
            } catch {
              return [ownerId, null];
            }
          }),
        );
        setOwnerProfiles(Object.fromEntries(profileResults));
      } else {
        setOwnerProfiles({});
      }
    } catch (e) {
      console.error("[SKILLS] Fetch error:", {
        status: e.response?.status,
        message: e.response?.data?.detail || e.message,
        url: e.config?.url,
      });
      setError("Unable to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    setLoading(true);
    setError("");
    try {
      console.log(
        "[SKILLS] Adding skill:",
        newSkill,
        "Auth:",
        user ? "YES" : "NO",
      );
      await axios.post("/skills", { name: newSkill });
      console.log("[SKILLS] Skill added successfully");
      setNewSkill("");
      await fetchSkills();
    } catch (e) {
      console.error("[SKILLS] Add skill error:", {
        status: e.response?.status,
        message: e.response?.data?.detail || e.message,
        url: e.config?.url,
        auth: user ? "YES" : "NO",
      });
      const msg =
        e.response?.data?.detail || "Failed to add skill";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (skill) => {
    const skillId = skill.id || skill._id;
    if (!skillId) {
      alert("Unable to delete: skill id is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this skill?"
    );
    if (!confirmed) return;

    setDeletingSkillId(skillId);
    setOpenMenuSkillId("");
    setError("");

    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      await axios.delete(`/skills/${skillId}`, config);

      // Update UI immediately without reloading the page
      setSkills((prev) =>
        prev.filter((item) => (item.id || item._id) !== skillId)
      );
    } catch (e) {
      console.error("[SKILLS] Delete skill error:", {
        status: e.response?.status,
        message: e.response?.data?.detail || e.message,
        url: e.config?.url,
      });
      const msg = e.response?.data?.detail || "Failed to delete skill";
      setError(msg);
      alert(msg);
    } finally {
      setDeletingSkillId("");
    }
  };

  return (
    <PageContainer>
      {/* HERO */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl px-8 py-10 shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight">
            Skill Exchange Platform
          </h1>
          <p className="text-indigo-200 mt-2 text-base max-w-lg">
            Learn something new by teaching what you know. Connect with people,
            exchange skills, grow together.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-8 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
            placeholder="Search skills like UI Design, Python, Guitar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSkills()}
          />
          <button
            onClick={fetchSkills}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* SKILLS GRID */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-3 text-sm text-gray-500">Loading skills...</p>
        </div>
      ) : skills.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s) => {
            const ownerProfile = ownerProfiles[s.owner_id];
            const skillId = s.id || s._id;
            const isOwner = user && s.owner_id === user.uid;
            return (
              <div
                key={skillId || s.name}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 border border-gray-100 group relative"
              >
                {isOwner && (
                  <div
                    className="absolute top-3 right-3"
                    data-skill-menu-root
                  >
                    <button
                      onClick={() =>
                        setOpenMenuSkillId(
                          openMenuSkillId === skillId ? "" : skillId
                        )
                      }
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                      aria-label="Open skill actions"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuSkillId === skillId && (
                      <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deletingSkillId === skillId}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingSkillId === skillId ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                  {s.name}
                </h3>

                {s.description && (
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                    {s.description}
                  </p>
                )}

                {ownerProfile && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700 text-sm shrink-0">
                      {ownerProfile.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {ownerProfile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatReputation(
                          ownerProfile.reputation,
                          ownerProfile.total_ratings,
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-gray-50">
                  {user && !isOwner ? (
                    <button
                      onClick={() => setRequestingSkill(s)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                    >
                      Request Exchange
                    </button>
                  ) : isOwner ? (
                    <div className="text-center py-2 text-xs text-gray-400 font-medium">
                      Your Skill
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-semibold text-gray-700">
            No Skills Found
          </h3>
          <p className="text-gray-500 mt-1 text-sm">
            Try a different search or be the first to add a skill.
          </p>
        </div>
      )}

      {/* ADD SKILL SECTION */}
      {user ? (
        <div className="mt-12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-bold mb-1">Share Your Expertise</h3>
          <p className="text-indigo-200 text-sm mb-5">
            Add a skill you can teach to help others learn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter skill (e.g., React Development)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <button
              onClick={addSkill}
              disabled={!newSkill.trim() || loading}
              className="px-5 py-2.5 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors duration-200 disabled:opacity-50"
            >
              Add Skill
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-12 bg-indigo-50 border border-indigo-200 text-indigo-800 px-6 py-6 rounded-xl text-center">
          <p className="mb-3 font-medium">Want to exchange skills?</p>
          <a
            href="/login"
            className="inline-block px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
          >
            Login with Google
          </a>
        </div>
      )}

      {/* REQUEST MODAL */}
      {requestingSkill && (
        <SendRequestModal
          skill={requestingSkill}
          onClose={() => setRequestingSkill(null)}
          onSubmit={async (offerSkill) => {
            await axios.post('/requests', {
              to_user_id: requestingSkill.owner_id,
              skill_offered: offerSkill,
              skill_requested: requestingSkill.name,
            });
          }}
        />
      )}
    </PageContainer>
  );
}
