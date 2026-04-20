// -----------------------------------------------------------------------
// LikedSongs.jsx
// Liked Songs Interface for Hooked
// Author: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */

import React, { use } from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getScreenStyle, cornerButtonStyle } from './styles'
import searchIcon from './search_button.png'
import logoutIcon from './logout_button.png'
import API_URL from './config'


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

    // search query to filter liked songs
    const [query, setQuery] = useState("")

    // pagination
    const [currentPage, setCurrentPage] = useState(0)
    const SONGS_PER_PAGE = 10

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
    async function deleteLikedSong(songId) {
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

    // filter liked songs based on search term
    const filteredSongs = likedSongs.filter(song => 
        song.song_name.toLowerCase().includes(query.toLowerCase()) || 
        song.artist_name.toLowerCase().includes(query.toLowerCase())
    );

    // calculate pagination
    const totalPages = Math.ceil(filteredSongs.length / SONGS_PER_PAGE);
    const paginatedSongs = filteredSongs.slice(currentPage * SONGS_PER_PAGE, (currentPage + 1) * SONGS_PER_PAGE);
    const hasNextPage = currentPage < totalPages - 1;
    const hasPrevPage = currentPage > 0;

    // ------------------ Render Liked Songs Screen ----------------------
    
    // main liked songs UI
    return (
        <div style = {getScreenStyle( 
            'rgba(147, 123, 255, 0.57)', 
            'rgba(255, 159, 104, 0.41)',
            'rgba(137, 59, 173, 0.4)',
            'rgba(255, 102, 0, 0.49)')}>

            {/* top left buttons */}
            <button style={cornerButtonStyle('left', 'top')} onClick={() => navigate('/liked')} title="Liked Songs">♥</button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '71px'}} onClick={() => navigate('/search')} title="Search">
                <img src={searchIcon} alt="Search" style={{ width: '24px', height: '24px' }} />
            </button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '126px'}} onClick={() => navigate('/profile/' + sessionStorage.getItem('username'))} title="Profile">👤</button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '181px'}} onClick={() => window.location.href = `${API_URL}/logoutapp`} title="Logout">
                <img src={logoutIcon} alt="Logout" style={{ width: '24px', height: '24px' }} />
            </button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '236px'}} onClick={() => navigate('/swipe')} title="Swipe">↔</button>

            {/* title of page */}
            <h2 className="liked-songs-header-style">Your Liked Tracks</h2>
            
             {/* list of liked songs */}
            <div className="liked-list-style">

                {/* search bar */}
                <input
                    type="text"
                    placeholder="  Search for liked songs"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setCurrentPage(0)
                    }}
                    className="liked-search-bar"
                />
                
                {/* display liked songs */}
                {paginatedSongs.length > 0 ? (
                    <>
                        {paginatedSongs.map((song) => (
                            <div key={song.song_id} 
                                className="liked-song-box-style">

                                {/* album art */}
                                <img src={song.song_image_url} 
                                    className="liked-album-art-style"  
                                />
                                
                                {/* song info*/}
                                <div className="liked-song-info-style">
                                    {/* song name */}
                                    <div className="liked-song-name-style">{song.song_name}</div>
                                    {/* artist name */}
                                    <div className="liked-artist-name-style">{song.artist_name}</div>
                                </div>

                                {/* delete song button */}
                                <button 
                                    onClick={() => deleteLikedSong(song.song_id)}
                                    className="delete-liked-button-style">
                                    ✕
                                </button>
                            </div>
                        ))}
                        
                        {/* pagination controls */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '16px', alignItems: 'center' }}>
                                <button 
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    disabled={!hasPrevPage}
                                    style={{
                                        opacity: hasPrevPage ? 1 : 0.3,
                                        background: 'none',
                                        border: 'none',
                                        color: '#debff7',
                                        fontSize: '20px',
                                        cursor: hasPrevPage ? 'pointer' : 'default'
                                    }}
                                >
                                    ‹ Prev
                                </button>
                                <span style={{ color: '#debff7', fontSize: '14px', fontWeight: 'bold' }}>
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={!hasNextPage}
                                    style={{
                                        opacity: hasNextPage ? 1 : 0.3,
                                        background: 'none',
                                        border: 'none',
                                        color: '#debff7',
                                        fontSize: '20px',
                                        cursor: hasNextPage ? 'pointer' : 'default'
                                    }}
                                >
                                    Next ›
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <p style={{ marginTop: '20px',
                        color: '#d6c4c0f6',
                        fontSize: '18px',
                        textAlign: 'center'
                    }}>
                        {query ? "No results found" : "Your list is empty."}
                    </p>
                )}                       

            </div>
        </div>
    )
}

export default LikedSongs