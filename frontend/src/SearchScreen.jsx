// -----------------------------------------------------------------------
// SearchScreen.jsx
// Search interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { getScreenStyle } from './styles'
import './index.css'

function SearchScreen() {
    if (!sessionStorage.getItem('username')) {
        window.location.replace(
            API_URL + '/auth/login?originalurl=' + window.location.pathname
        )
        return null
    }

    const navigate = useNavigate()
    const [results, setResults] = useState([])
    const [query, setQuery] = useState("")
    const [user, setUser] = useState(null)
    const controllerRef = useRef(null)

    function searchSong(my_params) {
        if (controllerRef.current !== null) controllerRef.current.abort()
        controllerRef.current = new AbortController()

        fetch(`${API_URL}/api/songs/search?params=${encodeURIComponent(my_params)}`, {
            signal: controllerRef.current.signal,
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
                'Accept': 'application/json',
            }
        })
            .then(res => {
                if (res.status === 401 || res.status === 422) {
                    window.location.replace(
                        API_URL + '/auth/login?originalurl=' + window.location.pathname
                    )
                    return null
                }
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) setResults(data)
                else setResults([])
            })
            .catch(err => {
                if (err.name !== 'AbortError') console.error("Search failed", err)
            })
    }

    // obtain the credentials from cookie
    // src: https://dev.to/velcruza/how-to-display-different-components-based-on-user-authentication-8o5
    useEffect(() => {
        fetch("/auth/user", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setUser(data)
                console.log(data) 
            })
    }, [])
    
    return (
        <div style = {{...getScreenStyle(
            'rgba(158, 123, 255, 0.4)',
            'rgba(217, 184, 227, 0.25)',
            'rgba(186, 151, 225, 0.4)',
            'rgba(219, 185, 210, 0.3)'),
            color: '#debff7'}}>

            <div className="card">
            <div className='card-header-2' style={{ paddingBottom: 0 }}> 
                {user && <p style={{ color: '#debff7', fontWeight: 'bold', cursor: 'pointer' }} 
                    onClick={() => navigate(`/profile/${user.username}`)}>Welcome, {user.username}!</p>}
            </div>

            <div className='small-header' style={{ marginTop: 0 }}>
                <h1>Search</h1>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className='back-btn' onClick={() => navigate("/swipe")}>Home</button>
                    <button className='back-btn' onClick={() => navigate(-1)}>Back</button>
                </div>
            </div>

            {/* search bar */}
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value)
                    searchSong(e.target.value)
                }}
                placeholder="Search songs..."
                className='input-box-2'
            />

            {/* results */}
            {results.length > 0 ? (
                <div className="results-list">
                    {results.map(song => (
                        <div key={song.song_id} className="search-song-box" onClick={() => navigate('/swipe', {state: {song}})}>
                            <img src={song.song_image_url} alt={song.song_name} className="song-img-box"/>
                            <span>{song.song_name} - {song.artist_name ?? 'Unknown Artist'}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className='no-results'>
                    <p>No results found!</p>
                </div>
            )}
        </div>
        </div>
    )
}

// -------------------- EXPORT --------------------
export default SearchScreen