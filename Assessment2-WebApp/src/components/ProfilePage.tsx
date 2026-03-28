import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { CategoryCard, type Song } from "./Categories";
import { getGenreTheme } from "../utils/genreTheme";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Tab = "profile" | "uploads" | "playlists" | "accounts";

export default function ProfilePage() {
  const { username: paramUsername } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<{ username: string; displayName: string; description?: string; profile_picture?: string } | null>(() => {
    const saved = sessionStorage.getItem("soundshare_user");
    return saved ? JSON.parse(saved) : { username: "admin", displayName: "Administrator" };
  });
  const [targetUser, setTargetUser] = useState<{ username: string; displayName: string; description?: string; profile_picture?: string } | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const contentRef = useRef<HTMLDivElement>(null);

  // States for specific features
  const [modal, setModal] = useState<{ 
    mode: "edit-song" | "upload-song" | "edit-playlist" | "create-playlist" | "delete-account" | "edit-profile" | null; 
    data?: any; 
    isClosing?: boolean; 
  }>({ mode: null });
  const [deletePass, setDeletePass] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [allFollowers, setAllFollowers] = useState<any[]>([]);
  const [allFollowing, setAllFollowing] = useState<any[]>([]);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

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
          fetch(`http://localhost:5000/users?username=${targetUser.username}`).then(r => r.json()),
          fetch("http://localhost:5000/songs").then(r => r.json()),
          fetch(`http://localhost:5000/contributors/contributions?username=${targetUser.username}`).then(r => r.json()),
          fetch(`http://localhost:5000/playlists/user/${targetUser.username}`).then(r => r.json()),
          fetch(`http://localhost:5000/users/${targetUser.username}/followers`).then(r => r.json()),
          fetch(`http://localhost:5000/users/${targetUser.username}/following`).then(r => r.json())
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

  /* ── Tab: Profile ── */
  const renderProfileTab = () => {

    const filteredFollowing = allFollowing.filter(u => 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFollowers = allFollowers.filter(u => 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    src={u.profile_picture ? `http://localhost:5000/userData/${u.profile_picture}` : `https://ui-avatars.com/api/?name=${u.username}&background=242435&color=fff&size=128`} 
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
                  <button onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit-song", data: song }); }} className="absolute bottom-16 right-3 w-8 h-8 rounded-lg bg-accent text-white opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.571L16.732 3.732z" /></svg>
                  </button>
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
                  <button onClick={() => setModal({ mode: "edit-playlist", data: pl })} className="p-2 rounded-lg bg-white/5 border border-white/10 text-fg-muted hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.571L16.732 3.732z" /></svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 overflow-hidden transition-all duration-500">
                {display.map((s: any, i: number) => <CategoryCard key={s.id} index={i} song={s} />)}
                {pl.songs.length > 5 && (
                  <button onClick={() => setExpandedPlaylistId(isExp ? null : pl.id)} className="w-full aspect-[4/5] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-accent text-fg-muted hover:text-accent transition-all group/toggle">
                    <div className={`w-10 h-10 rounded-full border border-current flex items-center justify-center transition-transform duration-300 ${isExp ? 'rotate-45' : ''}`}>+</div>
                    <span className="text-[10px] font-bold uppercase">{isExp ? 'Show Less' : 'Show All'}</span>
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
      const theme = getGenreTheme(song?.genre || "Electronic");
      
      return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div ref={editOverlayRef} className="absolute inset-0" onClick={closeModal} />
          <div 
            ref={editModalRef} 
            className="relative max-w-400 w-full h-160 bg-bg-card rounded-[4px] border border-white/10 flex flex-row overflow-hidden shadow-2xl"
            style={{ boxShadow: `0 0 50px ${theme.glow}` }}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-colors z-30">✕</button>
            <div className="shrink-0 h-full aspect-square bg-[#242435] border-r border-white/10 relative overflow-hidden">
              {song?.cover_path ? (
                <img src={`http://localhost:5000/${song.cover_path}`} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/5 opacity-50">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
              )}
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center space-y-6">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase" style={{ fontVariant: "small-caps" }}>{isEdit ? "Edit Track" : "Upload Track"}</h2>
              <div className="space-y-4">
                <input id="edit-song-title" type="text" defaultValue={isEdit ? song.title : ""} placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                <input type="text" defaultValue={isEdit ? song.artists : ""} placeholder="Artists" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                <div className="flex gap-4">
                  <input id="edit-song-genre" type="text" defaultValue={isEdit ? song.genre : ""} placeholder="Genre" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                  <input id="edit-song-year" type="number" defaultValue={isEdit ? song.release_year : new Date().getFullYear()} placeholder="Year" className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={async () => { 
                  const title = (document.getElementById('edit-song-title') as HTMLInputElement)?.value;
                  const genre = (document.getElementById('edit-song-genre') as HTMLInputElement)?.value;
                  const yearStr = (document.getElementById('edit-song-year') as HTMLInputElement)?.value;
                  const release_year = yearStr ? parseInt(yearStr, 10) : undefined;
                  if (title) {
                    try {
                      if (isEdit && song?.title) {
                        await fetch(`http://localhost:5000/songs?title=${song.title}`, {
                          method: "PUT", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ genre, release_year })
                        });
                      } else {
                        await fetch(`http://localhost:5000/songs`, {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title, genre, release_year })
                        });
                      }
                    } catch(err) { console.error(err); }
                  }
                  closeModal(); 
                }} className="flex-[2] py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light shadow-lg transition-all">{isEdit ? "Commit Changes" : "Confirm Upload"}</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Playlist Create/Edit UI
    if (modal.mode === "create-playlist" || modal.mode === "edit-playlist") {
      const isEdit = modal.mode === "edit-playlist";
      const playlist = modal.data;
      
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
                 <input id="edit-playlist-name" type="text" defaultValue={isEdit ? playlist.name : ""} placeholder="Playlist Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-accent" />
                 
                 <div className="flex flex-col flex-1 min-h-0 space-y-4">
                   <div className="relative">
                     <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input type="text" placeholder="Search tracks to add..." value={playlistSearch} onChange={e => setPlaylistSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent" />
                     {playlistSearch && (
                       <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-white/10 rounded-xl shadow-2xl z-40 p-2 overflow-hidden">
                         {filteredResults.length ? filteredResults.map(s => (
                           <button key={s.id} onClick={async () => { 
                             if (isEdit && playlist?.name && user?.username) {
                               try {
                                 await fetch(`http://localhost:5000/playlists/songs?name=${playlist.name}&creator=${user.username}`, {
                                   method: "POST", headers: { "Content-Type": "application/json" },
                                   body: JSON.stringify({ songIds: [s.id] })
                                 });
                               } catch(err) { console.error(err); }
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
                     <p className="text-[10px] uppercase tracking-widest font-bold text-accent px-1">Current Tracks ({isEdit ? playlist.songs.length : 0})</p>
                     {isEdit ? playlist.songs.map((s: any) => (
                       <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                         <div>
                           <p className="text-sm font-bold text-white">{s.title}</p>
                           <p className="text-[10px] text-fg-muted">{s.artists}</p>
                         </div>
                         <button className="text-white/20 hover:text-red-500 transition-colors p-2 cursor-pointer border-none bg-transparent">✕</button>
                       </div>
                     )) : (
                       <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">Empty... start searching!</div>
                     )}
                   </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                    <button onClick={async () => {
                      const plName = (document.getElementById('edit-playlist-name') as HTMLInputElement)?.value;
                      if (user?.username && plName) {
                        try {
                          if (isEdit && playlist?.name) {
                            await fetch(`http://localhost:5000/playlists?name=${playlist.name}&creator=${user.username}`, {
                              method: "PUT", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: plName })
                            });
                          } else {
                            await fetch(`http://localhost:5000/playlists?creator=${user.username}`, {
                              method: "POST", headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ name: plName, description: plName })
                            });
                          }
                        } catch(err) { console.error(err); }
                      }
                      closeModal(); 
                    }} className="flex-[2] py-4 bg-accent text-white font-bold rounded-2xl hover:bg-accent-light shadow-lg transition-all">{isEdit ? "Commit Changes" : "Assemble Mix"}</button>
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
                  src={user?.profile_picture ? `http://localhost:5000/userData/${user.profile_picture}` : `https://ui-avatars.com/api/?name=${user?.username}&background=E91E8C&color=fff&size=256`} 
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

                      const res = await fetch(`http://localhost:5000/users?username=${user.username}`, {
                        method: "PUT",
                        body: formData
                      });
                      const data = await res.json();
                      
                      // Update local state to reflect changes
                      if (data.profile_picture || displayName) {
                        const updated = { ...user, displayName: displayName || user.displayName, profile_picture: data.profile_picture || user.profile_picture };
                        setUser(updated);
                        sessionStorage.setItem("soundshare_user", JSON.stringify(updated));
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
                      await fetch(`http://localhost:5000/users?username=${user.username}`, { method: "DELETE" });
                      setUser(null);
                    } catch (err) { console.error(err); }
                  }
                  navigate("/"); 
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
                  src={targetUser?.profile_picture ? `http://localhost:5000/userData/${targetUser.profile_picture}` : `https://ui-avatars.com/api/?name=${targetUser?.username || 'User'}&background=E91E8C&color=fff&size=256`} 
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
                      const res = await fetch(`http://localhost:5000/users/${user.username}/follow/${targetUser?.username}`, { method });
                      if (res.ok) {
                        setIsFollowing(!isFollowing);
                        // Refresh followers list
                        const updateRes = await fetch(`http://localhost:5000/users/${targetUser?.username}/followers`).then(r => r.json());
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
    </div>
  );
}
