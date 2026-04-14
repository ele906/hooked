// -----------------------------------------------------------------------
// Profile.jsx
// Profile interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import './index.css'
import { getScreenStyle } from './styles'


function Profile(){

    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [likedSongs, setLikedSongs] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendPage, setFriendPage] = useState(0);
    const FRIENDS_PER_PAGE = 6;

    function handleBackButton() {
        console.log("back button clicked, go back to sw9pe page")
        navigate(-1)
    }

    // obtain the credentials from cookie
    // src: https://dev.to/velcruza/how-to-display-different-components-based-on-user-authentication-8o5
    useEffect(() => {
        fetch("/auth/user", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setUser(data)
                return fetch(`/api/songs/liked?user_id=${data.user_id}`, { credentials: "include" })
            })
            .then(res => res.json())
            .then(data => setLikedSongs(data.slice(0, 3)))
    }, [])

    return (
        <div style = {{...getScreenStyle(
            'rgba(202, 190, 235, 0.4)',
            'rgba(140, 183, 190, 0.25)',
            'rgba(209, 154, 184, 0.4)',
            'rgba(161, 174, 230, 0.3)'),
            color: '#debff7'}}>

        <div className='card'>
            <div className='card-header'>
                <h2>My Profile</h2>
                <button className = 'back-btn' onClick={handleBackButton}>
                Back
                </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '16px 0' }}>
            { /*Left: profile pic */}
                <div>
                    {user?.picture
                        ? <img
                            src={user.picture}
                            alt="Profile"
                            referrerPolicy="no-referrer"
                            style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #debff7' }}
                        />
                        : <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: '#1d1133', border: '2px solid #debff7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#debff7', fontSize: 32
                        }}>👤</div>
                    }
                </div>

                {/* Right: user info */}
                <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p><span style={{ color: '#debff7' }}>username:</span> {user?.username}</p>
                    <p><span style={{ color: '#debff7' }}>email:</span> {user?.email}</p>
                </div>
            </div>
                        
            <div className='small-header'>
                <h3 style={{ textAlign: 'left' , padding: '5px'}}>My Top Liked Songs</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px 12px' }}>
                {likedSongs.length === 0
                    ? <p style={{ color: '#e0e0e08e', fontSize: 13 }}>No liked songs yet!</p>
                    : likedSongs.map(song => (
                        <div key={song.song_id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={song.song_image_url} alt={song.song_name}
                                style={{ width: 45, height: 45, borderRadius: '8px' }} />
                            <div>
                                <p style={{ color: 'white', margin: 0, fontSize: 13 }}>{song.song_name}</p>
                                <p style={{ color: '#debff7', margin: 0, fontSize: 11 }}>{song.artist_name}</p>
                            </div>
                        </div>
                    ))
                }
            </div>

            <div className='small-header'>
                <h3 style={{ textAlign: 'left', padding: '5px' }}>My Friends</h3>
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