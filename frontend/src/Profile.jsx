// -----------------------------------------------------------------------
// Profile.jsx
// Profile interface for Hooked (in progress)
// Authors: Eleanor Liu
// Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useEffect, useState} from 'react'
import {useParams, useNavigate } from 'react-router-dom'
import './index.css'
import { getScreenStyle } from './styles'


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

    // get whoever's profile we're viewing
    useEffect(() => {
        fetch(`http://localhost:5000/api/users/get/${username}`, { credentials: "include" })
            .then(res => res.json())
            .then(data => setProfileData(data))
    }, [username])


    function handleBackButton() {
        console.log("back button clicked, go back to sw9pe page")
        navigate(-1)
    }

    function handleAddFriend() {
        fetch("http://localhost:5000/api/friends/add", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
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

    // obtain the credentials from cookie
    // src: https://dev.to/velcruza/how-to-display-different-components-based-on-user-authentication-8o5
    useEffect(() => {
        let isMounted = true; // 1. Prevent state updates on unmounted component
        const controller = new AbortController();

        fetch("/auth/user", { credentials: "include", signal: controller.signal })
            .then(res => {
            if (!res.ok) throw new Error("User auth failed");
            return res.json();
            })
            .then(data => {
            if (!isMounted) return;
            setUser(data);

            // 2. Safely check for data.user_id before fetching again
            if (data && data.user_id) {
                console.log(data.user_id);
                console.log(data.username);
                console.log(data.email);
                console.log(data.picture);
                
                fetch(`/api/users/${username}/liked`, { 
                    credentials: "include",
                    signal: controller.signal 
                });
            }
            })
            .then(res => res?.json())
            .then(data => {
            if (isMounted && data) {
                // 3. Ensure data exists before slicing
                setLikedSongs(Array.isArray(data) ? data.slice(0, 3) : []);
            }
            })
            .catch(err => {
            if (err.name === 'AbortError') return;
            console.error("Fetch error:", err); // 4. Add error handling [7]
            });

        return () => {
            isMounted = false;
            controller.abort(); // 5. Cleanup to prevent memory leaks
        };
        }, []);

    console.log("user:", user)
    console.log("username from url:", username)
    console.log("isOwnProfile:", isOwnProfile)
    console.log("profileData:", profileData)

    if (!user) return null
    if (!profileData && !isOwnProfile) return null  


    return (
        <div style = {{...getScreenStyle(
            'rgba(202, 190, 235, 0.4)',
            'rgba(140, 183, 190, 0.25)',
            'rgba(209, 154, 184, 0.4)',
            'rgba(161, 174, 230, 0.3)'),
            color: '#debff7'}}>

        <div className='card'>
            <div className='card-header'>
                {isOwnProfile ? (
                    <h2>My Profile</h2>
                ) : (
                    <h2>View Profile</h2>
                )}
                
                <button className = 'back-btn' onClick={handleBackButton}>
                Back
                </button>
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '16px 0' }}>
                <div>
                    {isOwnProfile ? (
                        user?.picture
                            ? <div className='pfp-border'>
                                <img src={user.picture} alt="Profile" referrerPolicy="no-referrer"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            : <div className='pfp-border'>👤</div>
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
                    {isOwnProfile && <p><span style={{ color: '#debff7' }}>email:</span> {user?.email}</p>}
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
                            onClick={() => new Audio(song.preview_mp3_url).play()}
                            onMouseEnter={e => e.currentTarget.querySelector('.hover-overlay').style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.querySelector('.hover-overlay').style.opacity = 0}
                        >
                            <div className='hover-overlay' style={{
                                position: 'absolute', inset: '-6px -8px',  // ← extends beyond the div
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
                        </div>
                    ))
                }
            </div>

            <div className='small-header'>
                <h3 style={{ textAlign: 'left', padding: '5px' }}>Friends</h3>
                <button className='add-btn' onClick={() => navigate('/friends')}>+</button>
            </div>

            {/* 3x2 friends grid */}
            {(() => {
                const pageFriends = friends.slice(friendPage * FRIENDS_PER_PAGE, (friendPage + 1) * FRIENDS_PER_PAGE);
                const slots = [...pageFriends, ...Array(6 - pageFriends.length).fill(null)];
                const hasNext = (friendPage + 1) * FRIENDS_PER_PAGE < friends.length;
                const hasPrev = friendPage > 0;

                return (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px' }}>
                            {slots.map((friend, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                        width: 50, height: 50, borderRadius: '50%',
                                        background: '#1d1133',
                                        border: `2px solid ${friend ? '#debff7' : '#444'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24
                                    }}>
                                        {friend?.picture
                                            ? <img src={friend.picture} referrerPolicy="no-referrer"
                                                style={{ width: 50, height: 50, borderRadius: '50%' }} alt={friend.username} />
                                            : <span style={{ color: friend ? '#debff7' : '#444' }}>👤</span>
                                        }
                                    </div>
                                    <p style={{ color: friend ? 'white' : '#444', fontSize: 11, margin: 0 }}>
                                        {friend?.username ?? ''}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* prev/next pagination */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '8px' }}>
                            <button onClick={() => setFriendPage(p => p - 1)} disabled={!hasPrev}
                                style={{ opacity: hasPrev ? 1 : 0.3, background: 'none', border: 'none', color: '#debff7', fontSize: 20, cursor: hasPrev ? 'pointer' : 'default' }}>‹</button>
                            <button onClick={() => setFriendPage(p => p + 1)} disabled={!hasNext}
                                style={{ opacity: hasNext ? 1 : 0.3, background: 'none', border: 'none', color: '#debff7', fontSize: 20, cursor: hasNext ? 'pointer' : 'default' }}>›</button>
                        </div>
                    </>
                );
            })()}
        </div>


        </div>
    );
}

// -------------------- EXPORT --------------------
export default Profile