// -----------------------------------------------------------------------
// LikedSongs.jsx
// Liked Songs Interface for Hooked
// Author: Lucille Rizo Patron
// Contributors:
// -----------------------------------------------------------------------

import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import searchIcon from './search_button.png'

function LikedSongs() {

    const navigate = useNavigate()

    const [likedSongs, setLikedSongs] = useState([])
    const [userId, setUserId] = useState(null)

    // ------------------ Liked Song Fetching ----------------------------

    // fetch liked songs
    useEffect(() => {
    fetch("http://localhost:5000/auth/user", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            setUserId(data.user_id)
            fetch(`http://localhost:5000/api/songs/liked?user_id=${data.user_id}`)
                .then(res => res.json())
                .then(songs => setLikedSongs(songs))
        })
        .catch(err => console.error(err))
}, [])

    // delete a liked song, takes an integer song id and removes it from the 
    // user's liked songs list
    const deleteSong = (songId) => {
        fetch(`http://localhost:5000/api/songs/liked/${songId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(res => {
            if (res.ok) {
                setLikedSongs(prev => prev.filter(song => song.song_id !== songId));
            }
        })
        .catch(err => console.error("Error deleting song:", err));
    }

    // ------------------ Render Liked Songs Screen ----------------------
    
    // main liked songs UI
    return (
        <div style={screenStyle}>

            {/* search button to go to search page */}
            <button 
                style={cornerButtonStyle('left', 'top')} 
                onClick={() => navigate('/search') }
            >    
                <img 
                    src={searchIcon} 
                    style={{ width: '30px', height: '30px' }} 
                />
            </button>

            {/* search button to go to search page */}
            <button 
                style={cornerButtonStyle('right', 'top')} 
                onClick={() => navigate('/swipe') }>
                ↔
            </button>

            {/* title of page */}
            <h2 style={headerStyle}>Your Liked Tracks</h2>
            

            <div style={likedListStyle}>

                {likedSongs.map((song) => (
                    <div key={song.song_id} style={songBoxStyle}>

                        {/* album art */}
                        <img src={song.song_image_url} 
                             style={artStyle}  
                        />
                        {/* song info*/}
                        <div style={songInfoStyle}>
                            {/* song name */}
                            <div 
                                style={nameStyle}>{song.song_name}
                            </div>
                            {/* artist name */}
                            <div 
                                style={artistStyle}>{song.artist_name}
                            </div>
                        </div>

                        {/* delete song button */}
                        <button 
                            onClick={() => deleteSong(song.song_id)}
                            style={deleteButtonStyle}>
                            ✕
                        </button>
                    </div>
                ))}
            </div>

        </div>
    )
}

// ------------------- Styles --------------------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#121214',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(147, 123, 255, 0.57) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(255, 159, 104, 0.41) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(137, 59, 173, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(255, 102, 0, 0.49) 0%, transparent 30%)
    `,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    position: 'relative',
}

// button style to navigate among screens from swipe screen
// takes string sides: sideX to determine right or left placement
// and sideY to determine bottom or top placement
const cornerButtonStyle = (sideX, sideY) => ({
    position: 'fixed',
    width: '50px',
    height: '50px',
    [sideX]: '15px',
    [sideY]: '15px',
    backgroundColor: '#a995dd4f',
    color: '#180d2b',
    fontSize: '30px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',   
    zIndex: 9999,
})

const headerStyle = {
    color: '#d6c4c0f6',
    fontSize: '40px',
    fontWeight: 'bold',
    fontFamily: 'Outfit, sans-serif',
    height: '25px',
    marginTop: '150px',
    marginBottom: '30px',
    textAlign: 'center',
}

// style for scrollable list of liked songs
const likedListStyle = {
    width: '100%',
    maxWidth: '500px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '10px'
}

const songBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#7a779636',
    borderRadius: '15px',
    padding: '10px',
    marginBottom: '15px',
    position: 'relative',
}

const artStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginRight: '15px',
    pointerevents: 'none'
}

const songInfoStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}

const nameStyle = {
    color: '#d6c4c0f6',
    fontWeight: 'bold',
    fontSize: '17px',
    fontFamily: 'Outfit, sans-serif',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
}

const artistStyle = {
    fontSize: '13px',
    fontFamily: 'Outfit, sans-serif',
    color: '#bda1ffd0',
    marginTop: '4px'
}

const deleteButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#ff8e4d',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '10px'
}

export default LikedSongs