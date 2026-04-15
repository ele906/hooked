// -----------------------------------------------------------------------
// SearchScreen.jsx
// Search interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { getScreenStyle } from './styles'
import './index.css'

function SearchScreen() {
    const navigate = useNavigate()
    const [results, setResults] = useState([])
    const [query, setQuery] = useState("")
    const [user, setUser] = useState(null)
    const controllerRef = useRef(null)

    function searchSong(my_params) {
        // abort previous request if one is running
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        // start a new one
        controllerRef.current = new AbortController()

        fetch(`http://localhost:5000/api/songs/search?params=${encodeURIComponent(my_params)}`, {
            signal: controllerRef.current.signal,
            credentials: "include" 
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setResults(data)
                } else {
                    setResults([])  // if not an array, just set empty
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Search failed", err)
                }
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

            <div className='card-header'>
            {/* back button */}
            <button className = 'back-btn' onClick={() => navigate('/swipe')}>
                ← Back
            </button>

            {user && <p style={{ color: '#debff7', fontWeight: 'bold', cursor: 'pointer' }} 
                onClick={() => navigate(`/profile/${user.username}`)}>Welcome, {user.username}!</p>}
            
            </div>
            

            {/* search bar */}
            <input
                type="text"
                value={query}
                // this detects changes in search and does the search function...
                onChange={(e) => {
                    setQuery(e.target.value)
                    searchSong(e.target.value)
                }}
                placeholder="Search songs..."
                className = 'input-box-2'
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