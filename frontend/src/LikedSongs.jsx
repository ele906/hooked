// -----------------------------------------------------------------------
// LikedSongs.jsx
// Liked Songs Interface for Hooked
// Author: Lucille Rizo Patron, 
// Contributors: Eleanor Liu, Derek Geng
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */

import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API_URL from './config'

import searchIcon from './search_button.png'

// Renders the liked songs screen where users can view and manage their 
// liked songs list.
function LikedSongs() {

    if (!sessionStorage.getItem('username')) {
        window.location.replace(
            API_URL + '/auth/login?originalurl=' + window.location.pathname
        )
        return null
    }

    // enables flow from one screen to another
    const navigate = useNavigate()

    // list of liked songs to render on screen
    const [likedSongs, setLikedSongs] = useState([])

    // store user id
    const [userId, setUserId] = useState(null)

    // ------------------ Liked Song Fetching ----------------------------

    // fetch liked songs
    useEffect(() => {
        async function fetchLikedSongs() {
            const authHeader = {
                'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
                'Accept': 'application/json',
            }
            const songsResponse = await fetch(`${API_URL}/api/songs/liked`, { headers: authHeader })
            if (songsResponse.status === 401 || songsResponse.status === 422) {
                window.location.replace(
                    API_URL + '/auth/login?originalurl=' + window.location.pathname
                )
                return
            }
            const songs = await songsResponse.json()
            if (Array.isArray(songs)) setLikedSongs(songs)
            else setLikedSongs([])
        }
        fetchLikedSongs()
    }, [])

    // delete a liked song, takes an integer song id and removes it from the 
    // user's liked songs list
    async function deleteSong(songId) {
        const response = await fetch(`${API_URL}/api/songs/liked/${songId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
                'Accept': 'application/json',
            }
        })
        if (response.status === 401 || response.status === 422) {
            window.location.replace(
                API_URL + '/auth/login?originalurl=' + window.location.pathname
            )
            return
        }
        if (response.ok) {
            setLikedSongs(prev => prev.filter(song => song.song_id !== songId))
        }
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
            
             {/* list of liked songs */}
            <div style={likedListStyle}>

                {likedSongs.map((song) => (
                    <div key={song.song_id} style={songBoxStyle}>

                        {/* album art */}
                        <img src={song.song_image_url} 
                             style={albumArtStyle}  
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

// style for boxes containing each liked song
const songBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#7a779636',
    borderRadius: '12px',
    padding: '10px',
    marginBottom: '12px',
    position: 'relative',
}

const albumArtStyle = {
    width: '58px',
    height: '58px',
    borderRadius: '7px',
    objectFit: 'cover',
    marginRight: '15px',
    pointerEvents: 'none'
}

// style for song info container
const songInfoStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}

// style for song name text
const nameStyle = {
    color: '#d6c4c0f6',
    fontWeight: 'bold',
    fontSize: '17px',
    fontFamily: 'Outfit, sans-serif',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
}

// style for artist name text
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

export default LikedSongs