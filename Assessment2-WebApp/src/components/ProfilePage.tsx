import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { CategoryCard, type Song, genres as categoriesGenres } from "./Categories";
import { getGenreTheme } from "../utils/genreTheme";
import { getMediaUrl } from "../utils/mediaUtils";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Tab = "profile" | "uploads" | "playlists" | "accounts";

export default function ProfilePage() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<{ username: string; displayName: string; description?: string; profile_picture?: string } | null>(() => {
    const saved = sessionStorage.getItem("dart_v6_1_user");
    return saved ? JSON.parse(saved) : { username: "admin", displayName: "Administrator" };
  });
  const [targetUser, setTargetUser] = useState<{ username: string; displayName: string; description?: string; profile_picture?: string } | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const genreOptions = categoriesGenres.map(g => g.name);

  // Form states
  const [songForm, setSongForm] = useState({
    title: "",
    genre: "Electronic",
    releaseYear: new Date().getFullYear().toString(),
    artists: "",
    coverFile: null as File | null,
    audioFile: null as File | null,
    error: null as string | null
  });

  const [playlistForm, setPlaylistForm] = useState({
    name: "",
    description: "",
    songIds: [] as number[],
    error: null as string | null
  });

  const contentRef = useRef<HTMLDivElement>(null);

  // States for specific features
  const [modal, setModal] = useState<{
    mode: "edit-song" | "upload-song" | "edit-playlist" | "create-playlist" | "delete-account" | "edit-profile" | null;
    data?: any;
    isClosing?: boolean;
  }>({ mode: null });

  // Sync song form when opening edit modal
  useEffect(() => {
    if (modal.mode === "edit-song" && modal.data) {
      setSongForm({
        title: modal.data.title,
        genre: modal.data.genre,
        releaseYear: modal.data.release_year.toString(),
        artists: modal.data.artists,
        coverFile: null,
        audioFile: null,
        error: null
      });
    } else if (modal.mode === "upload-song") {
      setSongForm({
        title: "",
        genre: "Electronic",
        releaseYear: new Date().getFullYear().toString(),
        artists: "",
        coverFile: null,
        audioFile: null,
        error: null
      });
    } else if (modal.mode === "create-playlist") {
      setPlaylistForm({
        name: "",
        description: "",
        songIds: [],
        error: null
      });
    } else if (modal.mode === "edit-playlist" && modal.data) {
      setPlaylistForm({
        name: modal.data.name,
        description: modal.data.description || "",
        songIds: modal.data.songs.map((s: any) => s.id),
        error: null
      });
    }
  }, [modal.mode, modal.data]);

  const [deletePass, setDeletePass] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [allFollowers, setAllFollowers] = useState<any[]>([]);
  const [allFollowing, setAllFollowing] = useState<any[]>([]);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning"
  });

  const editModalRef = useRef<HTMLDivElement>(null);
  const editOverlayRef = useRef<HTMLDivElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loggedInUser = user;
    if (!paramUsername) {
      if (!loggedInUser) { navigate("/login"); return; }
      setTargetUser(loggedInUser);
      setIsSelf(true);
    } else {
      const selfView = !!(loggedInUser && loggedInUser.username === paramUsername);
      setIsSelf(selfView);
      if (selfView) {
        setTargetUser(loggedInUser);
      } else {
        // Initial placeholder until fetch
        setTargetUser(prev => (prev?.username === paramUsername ? prev : {
          username: paramUsername,
          displayName: paramUsername.charAt(0).toUpperCase() + paramUsername.slice(1)
        }));
      }
    }
  }, [paramUsername, navigate, user]);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "back.out(1.2)" }
      );
    }
  }, [activeTab]);

  useEffect(() => {
    if (!targetUser?.username) return;

    const fetchProfileData = async () => {
      try {
        const [profileRes, songsRes, uploadsRes, playlistsRes, followersRes, followingRes] = await Promise.all([
          fetch(`https://web-project-seven-self.vercel.app/users?username=${targetUser.username}`).then(r => r.json()),
          fetch("https://web-project-seven-self.vercel.app/songs").then(r => r.json()),
          fetch(`https://web-project-seven-self.vercel.app/contributors/contributions?username=${targetUser.username}`).then(r => r.json()),
          fetch(`https://web-project-seven-self.vercel.app/playlists/user/${targetUser.username}`).then(r => r.json()),
          fetch(`https://web-project-seven-self.vercel.app/users/${targetUser.username}/followers`).then(r => r.json()),
          fetch(`https://web-project-seven-self.vercel.app/users/${targetUser.username}/following`).then(r => r.json())
        ]);

        if (profileRes && !profileRes.error) setTargetUser(profileRes);
        setAllSongs(songsRes || []);
        setUploadedSongs(uploadsRes || []);
        setPlaylists(playlistsRes || []);
        setAllFollowers(followersRes || []);
        setAllFollowing(followingRes || []);

        if (user && followersRes && Array.isArray(followersRes)) {
          setIsFollowing(followersRes.some((f: any) => f.username === user.username));
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, [targetUser?.username, user]);

  // Universal Modal Animation Handler
  useEffect(() => {
    if (modal.mode && !modal.isClosing && editModalRef.current && editOverlayRef.current) {
      // Entry Animation
      gsap.killTweensOf([editOverlayRef.current, editModalRef.current]);
      gsap.fromTo(editOverlayRef.current,
        { backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)" },
        { backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.8)", duration: 0.4 }
      );
      gsap.fromTo(editModalRef.current,
        { filter: "blur(20px)", opacity: 0, scale: 0.92, y: 20 },
        { filter: "blur(0px)", opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.05 }
      );
    }
  }, [modal.mode, modal.isClosing]);

  const closeModal = () => {
    if (editModalRef.current && editOverlayRef.current) {
      setModal(prev => ({ ...prev, isClosing: true }));
      gsap.to(editOverlayRef.current, { backdropFilter: "blur(0px)", backgroundColor: "rgba(0,0,0,0)", duration: 0.3 });
      gsap.to(editModalRef.current, {
        filter: "blur(20px)",
        opacity: 0,
        scale: 0.92,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setModal({ mode: null });
          setDeletePass("");
          setPlaylistSearch("");
          setSongForm({ title: "", genre: "Electronic", releaseYear: "", artists: "", coverFile: null, audioFile: null, error: null });
        }
      });
    } else {
      setModal({ mode: null });
    }
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "uploads", label: "Uploads" },
    { id: "playlists", label: "Playlists" },
    ...(isSelf ? [{ id: "accounts", label: "Account Management" }] : []),
  ];

  const handleSongSubmit = async () => {
    const isEdit = modal.mode === "edit-song";
    const songId = isEdit ? modal.data.id : null;
    
    // Validation
    if (!songForm.title || songForm.title.length > 128) {
      setSongForm(prev => ({ ...prev, error: "Title must be between 1 and 128 characters" }));
      return;
    }
    const year = parseInt(songForm.releaseYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > currentYear) {
      setSongForm(prev => ({ ...prev, error: `Invalid year (2000-${currentYear})` }));
      return;
    }
    if (!songForm.artists) {
      setSongForm(prev => ({ ...prev, error: "At least one artist name is required" }));
      return;
    }
    if (songForm.coverFile && songForm.coverFile.size > 2 * 1024 * 1024) {
      setSongForm(prev => ({ ...prev, error: "Image size must be under 2MB" }));
      return;
    }
    if (!isEdit && !songForm.audioFile) {
      setSongForm(prev => ({ ...prev, error: "Audio file is required for uploads" }));
      return;
    }

    const formData = new FormData();
    formData.append("title", songForm.title);
    formData.append("genre", songForm.genre);
    formData.append("release_year", songForm.releaseYear);
    formData.append("artists", songForm.artists);
    if (songForm.coverFile) formData.append("cover", songForm.coverFile);
    if (songForm.audioFile) formData.append("audio", songForm.audioFile);

    try {
      const url = isEdit ? `https://web-project-seven-self.vercel.app/songs?id=${songId}` : `https://web-project-seven-self.vercel.app/songs`;
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: formData
      });

      const result = await response.json();
      if (!response.ok) {
        setSongForm(prev => ({ ...prev, error: result.error || "Submission failed" }));
        return;
      }

      // Success - refresh data
      if (targetUser?.username) {
        const updatedUploads = await fetch(`https://web-project-seven-self.vercel.app/contributors/contributions?username=${targetUser.username}`).then(r => r.json());
        setUploadedSongs(updatedUploads || []);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setSongForm(prev => ({ ...prev, error: "Connection error" }));
    }
  };

  const handlePlaylistSubmit = async () => {
    const isEdit = modal.mode === "edit-playlist";
    const oldName = isEdit ? modal.data.name : null;

    // 1. Mandatory Validation
    if (!playlistForm.name || playlistForm.name.trim().length === 0) {
      setPlaylistForm(prev => ({ ...prev, error: "Playlist name is mandatory" }));
      return;
    }
    if (playlistForm.songIds.length === 0) {
      setPlaylistForm(prev => ({ ...prev, error: "At least one song is mandatory" }));
      return;
    }

    try {
      const url = isEdit
        ? `https://web-project-seven-self.vercel.app/playlists?name=${encodeURIComponent(oldName)}&creator=${user?.username}`
        : `https://web-project-seven-self.vercel.app/playlists?creator=${user?.username}`;

      const payload = {
        name: playlistForm.name,
        description: playlistForm.name, // Using name as description for now per original logic
        songIds: playlistForm.songIds
      };

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        setPlaylistForm(prev => ({ ...prev, error: result.error || "Submission failed" }));
        return;
      }

      // Success - refresh data
      if (user?.username) {
        const updatedPlaylists = await fetch(`https://web-project-seven-self.vercel.app/playlists/user/${user.username}`).then(r => r.json());
        setPlaylists(updatedPlaylists || []);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      setPlaylistForm(prev => ({ ...prev, error: "Connection error" }));
    }
  };

  const handleDeleteSong = (songId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete track?",
      message: "Are you sure you want to delete this track? This action cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`https://web-project-seven-self.vercel.app/songs?id=${songId}`, { method: "DELETE" });
          if (res.ok) {
            setUploadedSongs(prev => prev.filter(s => s.id !== songId));
            setConfirmDialog(p => ({ ...p, isOpen: false }));
          } else {
            const data = await res.json();
            setConfirmDialog({
              isOpen: true,
              title: "Error",
              message: data.error || "Failed to delete song",
              type: "danger",
              onConfirm: () => setConfirmDialog(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleDeletePlaylist = (plName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete playlist?",
      message: `Are you sure you want to delete the playlist "${plName}"?`,
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`https://web-project-seven-self.vercel.app/playlists?name=${encodeURIComponent(plName)}&creator=${user?.username}`, { method: "DELETE" });
          if (res.ok) {
            setPlaylists(prev => prev.filter(p => p.name !== plName));
            setConfirmDialog(p => ({ ...p, isOpen: false }));
          } else {
            const data = await res.json();
            setConfirmDialog({
              isOpen: true,
              title: "Error",
              message: data.error || "Failed to delete playlist",
              type: "danger",
              onConfirm: () => setConfirmDialog(p => ({ ...p, isOpen: false }))
            });
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  /* ── Tab: Profile ── */
  const renderProfileTab = () => {

    const filteredFollowing = allFollowing.filter(u =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredFollowers = allFollowers.filter(u =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const UserList = ({ title, users, emptyMsg }: { title: string, users: any[], emptyMsg: string }) => (
      <div className="mb-12">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-accent rounded-full" />
          {title}
        </h3>
        {users.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {users.map((u) => (
              <Link key={u.username} to={`/profile/${u.username}`} className="flex flex-col items-center gap-3 group no-underline">
                <div className="w-20 h-20 rounded-full border-2 border-white/5 group-hover:border-accent group-hover:scale-110 transition-all duration-300 p-0.5 overflow-hidden">
                  <img
                    src={getMediaUrl(u.profile_picture, 'profilePic') || `https://ui-avatars.com/api/?name=${u.username}&background=242435&color=fff&size=128`}
                    className="w-full h-full rounded-full object-cover"
                    alt=""
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors truncate w-24">{u.displayName}</p>
                  <p className="text-[0.65rem] text-fg-muted">@{u.username}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-10 px-6 rounded-2xl border border-dashed border-white/10 text-center text-fg-muted text-sm">{emptyMsg}</div>
        )}
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex gap-8 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-5 flex-1 transition-all hover:bg-white/10">
            <p className="text-fg-muted text-[0.65rem] uppercase tracking-widest font-bold mb-1">Followers</p>
            <p className="text-3xl font-bold text-white font-[var(--font-family-heading)]">{allFollowers.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-5 flex-1 transition-all hover:bg-white/10">
            <p className="text-fg-muted text-[0.65rem] uppercase tracking-widest font-bold mb-1">Following</p>
            <p className="text-3xl font-bold text-white font-[var(--font-family-heading)]">{allFollowing.length}</p>
          </div>
        </div>

        <div className="relative mb-8 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search connections..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent/50 transition-all font-[var(--font-family-body)]" />
        </div>

        <UserList title="Following" users={filteredFollowing} emptyMsg="No connections found." />
        <UserList title="Followers" users={filteredFollowers} emptyMsg="No followers found." />
      </div>
    );
  };

  /* ── Tab: Uploads ── */
  const renderUploadsTab = () => {
    const filtered = uploadedSongs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artists.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-accent rounded-full" />Uploaded Tracks</h3>
            {isSelf && (
              <button onClick={(e) => { e.stopPropagation(); setModal({ mode: "upload-song" }); }} className="px-5 py-2 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-light transition-all shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Upload Song
              </button>
            )}
          </div>
          <div className="relative max-w-md w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search uploads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none transition-all" />
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filtered.map((song, i) => (
              <div key={song.id} className="relative group/card transition-all duration-300">
                <CategoryCard index={i} song={song} />
                {isSelf && (
                  <div className="absolute bottom-16 right-3 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit-song", data: song }); }} className="w-8 h-8 rounded-lg bg-accent text-white opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10 flex items-center justify-center border-none cursor-pointer shadow-lg shadow-accent/20">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.571L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.id); }} className="w-8 h-8 rounded-lg bg-red-500 text-white opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10 flex items-center justify-center border-none cursor-pointer shadow-lg shadow-red-500/20">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 rounded-[24px] border border-dashed border-white/10 text-center text-fg-muted">No songs found.</div>
        )}
      </div>
    );
  };

  /* ── Tab: Playlists ── */
  const renderPlaylistsTab = () => {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-accent rounded-full" />Playlists</h3>
          {isSelf && <button onClick={() => setModal({ mode: "create-playlist" })} className="px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-light transition-all shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Playlist
          </button>}
        </div>
        {playlists.map(pl => {
          const isExp = expandedPlaylistId === pl.id;
          const display = isExp ? pl.songs : pl.songs.slice(0, 5);
          return (
            <div key={pl.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h4 className="text-xl font-bold text-white">{pl.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[0.65rem] text-fg-muted uppercase">{pl.songs.length} Tracks</span>
                </div>
                {isSelf && (
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ mode: "edit-playlist", data: pl })} className="p-2 rounded-lg bg-white/5 border border-white/10 text-fg-muted hover:text-white transition-all cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.571L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDeletePlaylist(pl.name)} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 transition-all duration-500">
                {display.map((s: any, i: number) => <CategoryCard key={s.id} index={i} song={s} contextSongs={pl.songs} />)}
                {pl.songs.length > 5 && (
                  <button onClick={() => setExpandedPlaylistId(isExp ? null : pl.id)} className="w-full aspect-[4/5] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-accent text-fg-muted hover:text-accent transition-all group/toggle border-none cursor-pointer">
                    <div className={`w-10 h-10 rounded-full border border-current flex items-center justify-center transition-transform duration-300 ${isExp ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExp ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{isExp ? 'Show Less' : 'Show More'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Tab: Account Management ── */
  const renderAccountTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="text-2xl font-bold text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-accent rounded-full" />Account Management</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/support" className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 no-underline group transition-all">
          <h4 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">Customer Support</h4>
          <p className="text-sm text-fg-muted">Need help? Contact our team for assistance.</p>
        </Link>
        <button onClick={() => setModal({ mode: "delete-account" })} className="p-8 text-left rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all border-none cursor-pointer">
          <h4 className="text-xl font-bold text-red-500 mb-2">Delete Account</h4>
          <p className="text-sm text-fg-muted">Permanently remove your account and all data.</p>
        </button>
      </div>
    </div>
  );

  const renderUniversalModal = () => {
    if (!modal.mode) return null;

    // Song/Upload UI
    if (modal.mode === "edit-song" || modal.mode === "upload-song") {
      const isEdit = modal.mode === "edit-song";
      const song = modal.data as Song;
      const theme = getGenreTheme(songForm.genre || "Electronic");

      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div ref={editOverlayRef} className="absolute inset-0" onClick={closeModal} />
          <div
            ref={editModalRef}
            className="relative max-w-400 w-full h-[640px] bg-bg-card rounded-[32px] border border-white/10 flex flex-row overflow-hidden shadow-2xl"
            style={{ boxShadow: `0 0 50px ${theme.glow}` }}
          >
            <button onClick={closeModal} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors z-30">✕</button>
            <div className="shrink-0 h-full aspect-square bg-[#242435] border-r border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
              {(songForm.coverFile || (isEdit && song?.cover_path)) ? (
                <img
                  src={songForm.coverFile ? URL.createObjectURL(songForm.coverFile) : getMediaUrl(song.cover_path, 'cover')}
                  className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-700"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/5 opacity-50 absolute inset-0">
                  <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xs font-bold uppercase tracking-widest">Select Cover Image</p>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSongForm(prev => ({ ...prev, coverFile: file, error: null }));
              }} />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 text-center text-xs font-bold text-white pointer-events-none">
                {songForm.coverFile ? "Change Image" : "Upload Artwork (Max 2MB)"}
              </div>
            </div>
            <div className="flex-1 p-12 flex flex-col justify-center space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase" style={{ fontVariant: "small-caps" }}>{isEdit ? "Edit Track" : "Upload Track"}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Track Title</label>
                  <input type="text" value={songForm.title} onChange={e => setSongForm(prev => ({ ...prev, title: e.target.value, error: null }))} placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Artist Names (comma separated)</label>
                  <input type="text" value={songForm.artists} onChange={e => setSongForm(prev => ({ ...prev, artists: e.target.value, error: null }))} placeholder="e.g. Creator, Feature" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Genre</label>
                    <select value={songForm.genre} onChange={e => setSongForm(prev => ({ ...prev, genre: e.target.value, error: null }))} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent appearance-none cursor-pointer">
                      {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Release Year</label>
                    <input type="number" value={songForm.releaseYear} onChange={e => setSongForm(prev => ({ ...prev, releaseYear: e.target.value, error: null }))} placeholder="Year" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                  </div>
                </div>

                {/* Audio File Input Section */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Audio File (.mp3, .flac, .wav)</label>
                  <div className="relative group/audio">
                    <input
                      type="file"
                      accept=".mp3,.flac,.wav"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setSongForm(prev => ({ ...prev, audioFile: file, error: null }));
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-white/5 border border-dashed border-white/10 rounded-xl p-4 flex items-center gap-4 group-hover/audio:border-accent/50 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{songForm.audioFile ? songForm.audioFile.name : (isEdit ? "Keep existing or replace..." : "Choose sound file")}</p>
                        <p className="text-[10px] text-fg-muted uppercase tracking-widest font-bold">{songForm.audioFile ? `${(songForm.audioFile.size / (1024 * 1024)).toFixed(2)} MB` : "Max 20MB"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {songForm.error && (
                <p className="text-[#ff4466] text-xs font-bold text-center animate-[authShake_0.35s_ease] py-2 bg-red-500/5 rounded-lg border border-red-500/10">
                  {songForm.error}
                </p>
              )}

              <div className="pt-4 flex gap-4">
                <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSongSubmit} className="flex-[2] py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light shadow-lg transition-all">{isEdit ? "Commit Changes" : "Confirm Upload"}</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Playlist Create/Edit UI
    if (modal.mode === "create-playlist" || modal.mode === "edit-playlist") {
      const isEdit = modal.mode === "edit-playlist";

      const filteredResults = allSongs.filter(s =>
        s.title.toLowerCase().includes(playlistSearch.toLowerCase()) ||
        s.artists.toLowerCase().includes(playlistSearch.toLowerCase())
      ).slice(0, 5);

      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div ref={editOverlayRef} className="absolute inset-0" onClick={closeModal} />
          <div
            ref={editModalRef}
            className="relative max-w-400 w-full h-160 bg-bg-card rounded-[4px] border border-white/10 flex flex-row overflow-hidden shadow-2xl"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors z-30">✕</button>
            <div className="shrink-0 h-full aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-r border-white/10 flex flex-col items-center justify-center p-8">
              <div className="w-32 h-32 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 border border-white/10 mb-6 group-hover:scale-105 transition-transform">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white text-center">{isEdit ? "Refining Collection" : "Assemble New Mix"}</h3>
            </div>
            <div className="flex-1 p-8 flex flex-col min-w-0">
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-tight" style={{ fontVariant: "small-caps" }}>{isEdit ? "Modify Playlist" : "Create Playlist"}</h2>
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <input
                  type="text"
                  value={playlistForm.name}
                  onChange={e => setPlaylistForm(prev => ({ ...prev, name: e.target.value, error: null }))}
                  placeholder="Playlist Title"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent"
                />

                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search tracks to add..." value={playlistSearch} onChange={e => setPlaylistSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent" />
                    {playlistSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-white/10 rounded-xl shadow-2xl z-40 p-2 overflow-hidden">
                        {filteredResults.length ? filteredResults.map(s => (
                          <button key={s.id} onClick={() => {
                            if (!playlistForm.songIds.includes(s.id)) {
                              setPlaylistForm(prev => ({ ...prev, songIds: [...prev.songIds, s.id], error: null }));
                            }
                            setPlaylistSearch("");
                          }} className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg text-sm flex justify-between group border-none bg-transparent cursor-pointer">
                            <span className="text-white font-medium">{s.title} <span className="text-fg-muted ml-2 text-xs">— {s.artists}</span></span>
                            <span className="text-accent opacity-0 group-hover:opacity-100">+ Add</span>
                          </button>
                        )) : <div className="px-4 py-2 text-xs text-fg-muted italic text-center">No results found in library</div>}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 overscroll-contain no-scrollbar">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Current Tracks ({playlistForm.songIds.length})</p>
                    {playlistForm.songIds.length > 0 ? playlistForm.songIds.map((sid: number) => {
                      const s = allSongs.find(song => song.id === sid);
                      if (!s) return null;
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-white">{s.title}</p>
                            <p className="text-[10px] text-fg-muted">{s.artists}</p>
                          </div>
                          <button
                            onClick={() => setPlaylistForm(prev => ({ ...prev, songIds: prev.songIds.filter(id => id !== sid) }))}
                            className="text-white/20 hover:text-red-500 transition-colors p-2 cursor-pointer border-none bg-transparent"
                          >✕</button>
                        </div>
                      );
                    }) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">Empty... start searching!</div>
                    )}
                  </div>
                </div>

                {playlistForm.error && (
                  <p className="text-[#ff4466] text-xs font-bold text-center animate-[authShake_0.35s_ease] py-2 bg-red-500/5 rounded-lg border border-red-500/10">
                    {playlistForm.error}
                  </p>
                )}

                <div className="pt-4 flex gap-4">
                  <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                  <button onClick={handlePlaylistSubmit} className="flex-[2] py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light shadow-lg transition-all">{isEdit ? "Commit Changes" : "Assemble Mix"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modal.mode === "edit-profile") {
      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div ref={editOverlayRef} className="absolute inset-0" onClick={closeModal} />
          <div
            ref={editModalRef}
            className="relative max-w-400 w-full h-160 bg-bg-card rounded-[4px] border border-white/10 flex flex-row overflow-hidden shadow-2xl"
          >
            <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors z-30">✕</button>
            <div className="shrink-0 h-full aspect-square bg-[#242435] border-r border-white/10 flex flex-col items-center justify-center p-12">
              <div className="w-48 h-48 rounded-full border-4 border-accent p-1 overflow-hidden group">
                <img
                  src={getMediaUrl(user?.profile_picture, 'profilePic') || `https://ui-avatars.com/api/?name=${user?.username}&background=E91E8C&color=fff&size=256`}
                  className="w-full h-full rounded-full object-cover"
                  alt=""
                />
              </div>
              <input type="file" ref={profileFileRef} className="hidden" accept="image/*" />
              <button onClick={() => profileFileRef.current?.click()} className="mt-8 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-accent transition-all">Change Avatar</button>
            </div>
            <div className="flex-1 p-12 flex flex-col justify-center space-y-8">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase" style={{ fontVariant: "small-caps" }}>Refine Profile</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Display Name</label>
                  <input id="edit-display-name" type="text" defaultValue={user?.displayName} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Professional Bio</label>
                  <textarea id="edit-bio" rows={4} placeholder="Tell the world your story..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent resize-none no-scrollbar" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={async () => {
                  const displayName = (document.getElementById('edit-display-name') as HTMLInputElement)?.value;
                  const description = (document.getElementById('edit-bio') as HTMLTextAreaElement)?.value;
                  if (user?.username) {
                    try {
                      const formData = new FormData();
                      if (displayName) formData.append("display_name", displayName);
                      if (description) formData.append("description", description);
                      if (profileFileRef.current?.files?.[0]) {
                        formData.append("profile_picture", profileFileRef.current.files[0]);
                      }

                      const res = await fetch(`https://web-project-seven-self.vercel.app/users?username=${user.username}`, {
                        method: "PUT",
                        body: formData
                      });
                      const data = await res.json();

                      // Update local state to reflect changes
                      if (data.profile_picture || displayName) {
                        const updated = { ...user, displayName: displayName || user.displayName, profile_picture: data.profile_picture || user.profile_picture };
                        setUser(updated);
                        sessionStorage.setItem("dart_v6_1_user", JSON.stringify(updated));
                      }
                    } catch (err) { console.error(err); }
                  }
                  closeModal();
                }} className="flex-[2] py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light shadow-lg transition-all">Update Identity</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modal.mode === "delete-account") {
      return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div ref={editOverlayRef} className="absolute inset-0" onClick={closeModal} />
          <div ref={editModalRef} className="relative w-full max-w-md bg-bg-card rounded-[32px] border border-red-500/20 p-10 shadow-3xl">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Delete Account?</h2>
            <p className="text-sm text-fg-muted mb-8">Deleting your account is permanent. All songs, playlists, and followers will be removed forever.</p>
            <div className="space-y-4">
              <input type="password" placeholder="Enter Password" value={deletePass} onChange={e => setDeletePass(e.target.value)} className="w-full bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/50" />
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white rounded-2xl hover:bg-white/10">Cancel</button>
              <button
                disabled={!deletePass}
                onClick={async () => {
                  if (user?.username) {
                    try {
                      const res = await fetch(`https://web-project-seven-self.vercel.app/users?username=${user.username}`, { 
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: deletePass })
                      });
                      if (res.ok) {
                        setUser(null);
                        navigate("/");
                      } else {
                        const data = await res.json();
                        setConfirmDialog({
                          isOpen: true,
                          title: "Deletion Failed",
                          message: data.error || "Failed to delete account",
                          type: "danger",
                          onConfirm: () => setConfirmDialog(p => ({ ...p, isOpen: false }))
                        });
                        return;
                      }
                    } catch (err) { console.error(err); }
                  }
                }}
                className="flex-[2] py-4 bg-red-500 text-white font-bold rounded-2xl disabled:opacity-30 disabled:grayscale transition-all"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderConfirmDialog = () => {
    if (!confirmDialog.isOpen) return null;
    const isDanger = confirmDialog.type === "danger";

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative w-full max-w-sm bg-bg-card rounded-3xl border border-white/10 p-8 shadow-3xl transform animate-in zoom-in-95 duration-300">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{confirmDialog.title}</h2>
          <p className="text-sm text-fg-muted mb-8 leading-relaxed">{confirmDialog.message}</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
              className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all cursor-pointer border-none"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDialog.onConfirm}
              className={`flex-1 py-3 text-white font-bold rounded-xl transition-all cursor-pointer border-none shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-accent hover:bg-accent-light shadow-accent/20'}`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary text-fg-primary flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-20 content-margins">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-12 flex flex-col md:flex-row items-center md:items-end gap-8 pb-12 border-b border-white/5">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-accent to-accent-light p-1 shadow-2xl overflow-hidden relative z-10">
                <img
                  src={getMediaUrl(targetUser?.profile_picture, 'profilePic') || `https://ui-avatars.com/api/?name=${targetUser?.username || 'User'}&background=E91E8C&color=fff&size=256`}
                  className="w-full h-full rounded-full object-cover"
                  alt=""
                />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{targetUser?.displayName || targetUser?.username || "User"}</h1>
                <div className="px-3 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[0.6rem] font-bold uppercase tracking-widest transition-all">Pro</div>
              </div>
              <p className="text-fg-secondary mb-3"><span className="text-accent/60">@</span>{targetUser?.username || "user"}</p>
              <p className="text-sm text-fg-muted max-w-md mx-auto md:mx-0 line-clamp-2 italic">
                {targetUser?.description || "No bio provided."}
              </p>
            </div>
            <div className="flex gap-4">
              {isSelf && (
                <button onClick={() => setModal({ mode: "edit-profile" })} className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all">Edit Profile</button>
              )}
              {!isSelf && (
                <button
                  onClick={async () => {
                    if (!user) return navigate("/login");
                    try {
                      const method = isFollowing ? "DELETE" : "POST";
                      const res = await fetch(`https://web-project-seven-self.vercel.app/users/${user.username}/follow/${targetUser?.username}`, { method });
                      if (res.ok) {
                        setIsFollowing(!isFollowing);
                        // Refresh followers list
                        const updateRes = await fetch(`https://web-project-seven-self.vercel.app/users/${targetUser?.username}/followers`).then(r => r.json());
                        setAllFollowers(updateRes || []);
                      }
                    } catch (err) { console.error(err); }
                  }}
                  className={`px-10 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${isFollowing ? "bg-white/5 border border-white/10 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" : "bg-accent text-white hover:bg-accent-light"}`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar py-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as Tab); setSearchQuery(""); }}
                className={`relative px-8 py-4 text-sm font-bold transition-all border-none bg-transparent cursor-pointer whitespace-nowrap rounded-2xl ${activeTab === tab.id ? "text-accent bg-accent/5" : "text-fg-secondary hover:text-white"}`}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-2 left-8 right-8 h-[3px] bg-accent rounded-full shadow-[0_2px_10px_rgba(233,30,140,0.8)]" />}
              </button>
            ))}
          </div>
          <div ref={contentRef}>
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "uploads" && renderUploadsTab()}
            {activeTab === "playlists" && renderPlaylistsTab()}
            {activeTab === "accounts" && renderAccountTab()}
          </div>
        </div>
      </main>
      <Footer />
      {renderUniversalModal()}
      {renderConfirmDialog()}
    </div>
  );
}