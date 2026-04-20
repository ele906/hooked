// -----------------------------------------------------------------------
// LikedSongs.jsx
// Liked Songs Interface for Hooked
// Authors: Lucille Rizo Patron, Eleanor Liu
// -----------------------------------------------------------------------

import React, { use } from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getScreenStyle, cornerButtonStyle } from './styles'
import API_URL from './config'
import { useAuth } from './AuthContext'
import searchIcon from './search_button.png'
import Navigation from './Navigation'

// Renders the liked songs screen where users can view and manage their 
// liked songs list.
function LikedSongs() {

    // enables flow from one screen to another
    const navigate = useNavigate()

    // list of liked songs to render on screen
    const [likedSongs, setLikedSongs] = useState([])

    // store user id
    const { user } = useAuth() 
    const [userId, setUserId] = useState(null)

    // search query to filter liked songs
    const [query, setQuery] = useState("")

    // ------------------ Liked Song Fetching ----------------------------

    // check if user in authenticated before rendering the liked screen
    // and get user id
    useEffect(() => {
        if (user) setUserId(user.user_id)
    }, [user])

    // fetch liked songs
    useEffect(() => {
        async function fetchLikedSongs() {
            try {
                console.log("[LikedSongs] Fetching user authentication")
                
                // check for user authentication before fetching liked songs
                const authResponse = await fetch(`${API_URL}/auth/user`, { 
                    credentials: "include" 
                })

                if (!authResponse.ok) {
                    throw new Error(`Auth failed with status ${authResponse.status}`)
                }

                const authData = await authResponse.json()

                if (!authData || !authData.user_id) {
                    throw new Error("No user_id in auth response")
                }

                // set userId
                setUserId(authData.user_id)
                console.log("[LikedSongs] Fetching liked songs for userId:", authData.user_id)

                const songsResponse = await fetch(`${API_URL}/api/songs/liked?user_id=${authData.user_id}`, 
                    { credentials: "include" }
                )
                
                const songs = await songsResponse.json()

                // update liked songs list after fetching
                if (Array.isArray(songs)) {
                    console.log("[LikedSongs] Setting liked songs, count:", songs.length)
                    setLikedSongs(songs)
                } else {
                    console.error("[LikedSongs] Expected array of songs but got:", songs)
                    setLikedSongs([])
                }

            } catch (error) {
                console.error("[LikedSongs] Error fetching liked songs:", error.message)
                setLikedSongs([])
            }
        }

        fetchLikedSongs()
    }, [])

    // delete a liked song, takes an integer song id and removes it from the 
    // user's liked songs list
    async function deleteLikedSong(songId) {
        try {
            console.log("[LikedSongs] Deleting song with id:", songId)
                
            const response = await fetch(`${API_URL}/api/songs/liked/${songId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                console.log("[LikedSongs] Successfully deleted song, updating UI")
                // update UI by filtering out deleted song
                setLikedSongs(prev => prev.filter(song => song.song_id !== songId))
            } else {
                throw new Error(`Delete failed with status: ${response.status}`)
            }

        } catch (error) {
            console.error("[LikedSongs] Error deleting song:", error.message)
        }
    }

    // filter liked songs based on search term
    const filteredSongs = likedSongs.filter(song => 
        song.song_name.toLowerCase().includes(query.toLowerCase()) || 
        song.artist_name.toLowerCase().includes(query.toLowerCase())
    );

    // ------------------ Render Liked Songs Screen ----------------------
    
    // main liked songs UI
    return (
        <div style = {getScreenStyle( 
            'rgba(147, 123, 255, 0.57)', 
            'rgba(255, 159, 104, 0.41)',
            'rgba(137, 59, 173, 0.4)',
            'rgba(255, 102, 0, 0.49)')}>

            <Navigation />

            {/* title of page */}
            <h2 className="liked-songs-header-style">Your Liked Tracks</h2>
            
             {/* list of liked songs */}
            <div className="liked-list-style">

                {/* search bar */}
                <input
                    type="text"
                    placeholder="  Search for liked songs"
                    value={query}
                    onChange={(e) => 
                        setQuery(e.target.value)
                    }
                    className="liked-search-bar"
                />
                
                {/* display liked songs */}
                {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
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
                    ))
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