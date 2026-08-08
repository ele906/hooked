// -----------------------------------------------------------------------
// Profile.jsx
// Profile interface for Hooked (in progress)
// Authors: Eleanor Liu
// Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useEffect, useRef, useState} from 'react'
import {useParams, useNavigate } from 'react-router-dom'
import './index.css'
import { getScreenStyle, cornerButtonStyle } from './styles'
import API_URL from './config'
import Navigate from "./Navigation"

function Profile(){

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { username } = useParams()       // whoever's profile we're viewing
    const isOwnProfile = user?.username === username

    // --- stats ---
    const [likedSongs, setLikedSongs] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendPage, setFriendPage] = useState(0);
    const [isFriend, setIsFriend] = useState(false)
    const FRIENDS_PER_PAGE = 6;

    const [profileData, setProfileData] = useState(null)
    const [uploadedPfp, setUploadedPfp] = useState(null) // override pfp after upload
    const [pfpUploading, setPfpUploading] = useState(false)
    const pfpInputRef = useRef(null)

    // audio playback for liked songs preview
    const audioRef = useRef(null)
    const [playingId, setPlayingId] = useState(null)

    function handleSongClick(song) {
        if (playingId === song.song_id) {
            // same song — toggle pause/resume
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
            setPlayingId(null)
        } else {
            // different song — stop previous and play new one
            if (audioRef.current) {
                audioRef.current.pause()
            }
            audioRef.current = new Audio(song.preview_mp3_url)
            audioRef.current.loop = true
            audioRef.current.play().catch(() => {})
            setPlayingId(song.song_id)
        }
    }

    // get whoever's profile we're viewing
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accesstoken')
        if (!accessToken) return
        
        fetch(`${API_URL}/api/users/get/${username}`, { 
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Accept': 'application/json',
            }
        })
            .then(res => res.json())
            .then(data => setProfileData(data))
    }, [username])


    function handleBackButton() {
        console.log("back button clicked, go back to swipe page")
        navigate(-1)
    }

    async function uploadPfpFile(file) {
        if (!file || !file.type.startsWith('image/')) return
        setPfpUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', 'a3grzjto')
            const res = await fetch('https://api.cloudinary.com/v1_1/dutrsvhz4/image/upload', {
                method: 'POST', body: formData
            })
            const data = await res.json()
            const url = data.secure_url
            const accessToken = sessionStorage.getItem('accesstoken')
            await fetch(`${API_URL}/api/users/update-pfp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify({ user_image_url: url })
            })
            setUploadedPfp(url)
        } catch (err) {
            console.error('pfp upload failed', err)
        } finally {
            setPfpUploading(false)
        }
    }

    async function handlePfpDrop(e) {
        e.preventDefault()
        await uploadPfpFile(e.dataTransfer.files[0])
    }

    function handlePfpDragOver(e) { e.preventDefault() }

    async function handlePfpFileChange(e) {
        await uploadPfpFile(e.target.files[0])
        e.target.value = ''
    }

    function handleAddFriend() {
        const accessToken = sessionStorage.getItem('accesstoken')
        fetch(`${API_URL}/api/friends/add`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': 'Bearer ' + accessToken,
            },
            body: JSON.stringify({ friend_username: profileData.username })
        })
            .then(res => res.json())
            .then(data => {
                if (data.added) {
                    setIsFriend(true)  // ← add this
                } else {
                    alert(data.error || "Something went wrong")
                }
            })
            .catch(err => console.error("Add friend failed", err))
    }

    // Get current user from sessionStorage (set by JWT auth flow)
    // Fetch profile data and liked songs
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const accessToken = sessionStorage.getItem('accesstoken')
        const currentUsername = sessionStorage.getItem('username')

        // Set current user from sessionStorage, then fetch email from API
        if (isMounted && currentUsername) {
            setUser({ username: currentUsername });
        }
        if (accessToken) {
            fetch(`${API_URL}/api/getuserinfo`, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (isMounted && data) {
                        setUser(prev => ({ ...prev, email: data.email }))
                    }
                })
                .catch(() => {})
        }

        // Fetch liked songs for the profile being viewed
        if (accessToken && username) {
            fetch(`${API_URL}/api/users/${username}/liked`, { 
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                },
                signal: controller.signal 
            })
            .then(res => res.json())
            .then(data => {
                if (isMounted && data) {
                    setLikedSongs(Array.isArray(data) ? data : []);
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error("Fetch liked songs error:", err);
            });

            // Fetch friends for the profile being viewed
            fetch(`${API_URL}/api/users/${username}/friends`, { 
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                },
                signal: controller.signal 
            })
            .then(res => res.json())
            .then(data => {
                if (isMounted && Array.isArray(data)) {
                    setFriends(data);
                }
            })
            .catch(err => {
                if (err.name === 'AbortError') return;
                console.error("Fetch friends error:", err);
            });
        }

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [username]);

    if (!user) return null
    if (!profileData && !isOwnProfile) return null  


    return (
        <div style = {{...getScreenStyle(
            'rgba(255, 163, 224, 0.57)',
            'rgba(214, 163, 226, 0.25)',
            'rgba(255, 75, 225, 0.4)',
            'rgba(163, 126, 194, 0.31)'),
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#debff7'}}>

        <Navigate />

        <div className='profile-card'>
            <div className='profile-header-style'>
                {isOwnProfile ? (
                    <>My Profile</>
                ) : (
                    <>View Profile</>
                )}
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '16px 0' }}>
                <div>
                    {isOwnProfile ? (
                        <div
                            onDrop={handlePfpDrop}
                            onDragOver={handlePfpDragOver}
                            onClick={() => pfpInputRef.current?.click()}
                            title="Click or drop an image to change your profile picture"
                            style={{ cursor: 'pointer', position: 'relative' }}
                        >
                            <input
                                ref={pfpInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePfpFileChange}
                            />
                            {(uploadedPfp || user?.picture || profileData?.user_image_url)
                                ? <div className='pfp-border'>
                                    <img src={uploadedPfp || user?.picture || profileData?.user_image_url} alt="Profile" referrerPolicy="no-referrer"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {pfpUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white' }}>saving…</div>}
                                </div>
                                : <div className='pfp-border' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, fontSize: 11, color: '#debff7' }}>
                                    {pfpUploading ? 'saving…' : <><span>👤</span><span>drop photo</span></>}
                                </div>
                            }
                        </div>
                    ) : (
                        profileData?.user_image_url
                            ? <div className='pfp-border'>
                                <img src={profileData.user_image_url} alt="Profile" referrerPolicy="no-referrer"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            : <div className='pfp-border'>👤</div>
                    )}
                </div>

                <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <p><span style={{ color: '#debff7' }}>username:</span> {profileData?.username}</p>
                    {isOwnProfile && user?.email && (
                        <p><span style={{ color: '#debff7' }}>email:</span> {user.email}</p>
                    )}
                    {!isOwnProfile &&
                        <button onClick={handleAddFriend} disabled={isFriend} style={{
                            marginTop: '8px',
                            padding: '5px 12px',
                            borderRadius: '5px',
                            border: '2px solid #debff7',
                            background: isFriend ? '#debff7' : '#1d1133',
                            color: isFriend ? '#1d1133' : '#debff7',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: isFriend ? 'default' : 'pointer',
                            width: 'fit-content',
                        }}>
                            {isFriend ? 'Friended!' : '+ Add Friend'}
                        </button>
                    }
                </div>
            </div>
                        
            <div className='small-header'>
                <h3 style={{ textAlign: 'left' , padding: '5px'}}>Recently Liked Songs</h3>
                <button className='add-btn' onClick={() => navigate('/liked')}>♡</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px 12px' }}>
                {likedSongs.length === 0
                    ? <p style={{ color: '#e0e0e08e', fontSize: 13 }}>No liked songs yet!</p>
                    : likedSongs.map(song => (
                        <div key={song.song_id}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}
                            onClick={() => handleSongClick(song)}
                            onMouseEnter={e => e.currentTarget.querySelector('.hover-overlay').style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.querySelector('.hover-overlay').style.opacity = 0}
                        >
                            <div className='hover-overlay' style={{
                                position: 'absolute', inset: '-6px -8px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                pointerEvents: 'none'
                            }}/>
                            <img src={song.song_image_url} alt={song.song_name}
                                style={{ width: 45, height: 45, borderRadius: '8px' }} />
                            <div>
                                <p style={{ color: 'white', margin: 0, fontSize: 13, textAlign: 'left' }}>{song.song_name}</p>
                                <p style={{ color: '#debff7', margin: 0, fontSize: 11, textAlign: 'left' }}>{song.artist_name}</p>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 16, color: '#debff7' }}>
                                {playingId === song.song_id ? '⏸' : '▶'}
                            </span>
                        </div>
                    ))
                }
            </div>

            <div className='small-header'>
                <h3 style={{ textAlign: 'left', padding: '5px' }}>Friends</h3>
                <button className='add-btn' onClick={() => navigate('/friends')}>+</button>
            </div>

            {/* friends grid */}
            {(() => {
                const pageFriends = friends.slice(friendPage * FRIENDS_PER_PAGE, (friendPage + 1) * FRIENDS_PER_PAGE);
                const hasNext = (friendPage + 1) * FRIENDS_PER_PAGE < friends.length;
                const hasPrev = friendPage > 0;

                if (friends.length === 0) {
                    return <p style={{ color: '#e0e0e08e', fontSize: 13, padding: '12px', textAlign: 'center' }}>No friends yet!</p>;
                }

                return (
                    <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', padding: '12px' }}>
                            {pageFriends.map((friend, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                        width: 50, height: 50, borderRadius: '50%',
                                        background: '#1d1133',
                                        border: '2px solid #debff7',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => navigate(`/profile/${friend.username}`)}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = '#cdbfea'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#debff7'; }}
                                    >
                                        {friend?.user_image_url
                                            ? <img src={friend.user_image_url} referrerPolicy="no-referrer"
                                                style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} alt={friend.username} />
                                            : <span style={{ color: '#debff7' }}>👤</span>
                                        }
                                    </div>
                                    <p style={{ color: 'white', fontSize: 11, margin: 0, maxWidth: '60px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {friend?.username}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* pagination only if more than 6 friends */}
                        {friends.length > FRIENDS_PER_PAGE && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '8px' }}>
                                <button onClick={() => setFriendPage(p => p - 1)} disabled={!hasPrev}
                                    style={{ opacity: hasPrev ? 1 : 0.3, background: 'none', border: 'none', color: '#debff7', fontSize: 20, cursor: hasPrev ? 'pointer' : 'default' }}>‹</button>
                                <button onClick={() => setFriendPage(p => p + 1)} disabled={!hasNext}
                                    style={{ opacity: hasNext ? 1 : 0.3, background: 'none', border: 'none', color: '#debff7', fontSize: 20, cursor: hasNext ? 'pointer' : 'default' }}>›</button>
                            </div>
                        )}
                    </>
                );
            })()}
        </div>


        </div>
    );
}

// -------------------- EXPORT --------------------
export default Profile