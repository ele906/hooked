// -----------------------------------------------------------------------
// SearchScreen.jsx
// Search interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle } from './styles'
import searchIcon from './search_button.png'
import logoutIcon from './logout_button.png'
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

        const accessToken = sessionStorage.getItem('accesstoken')
        
        fetch(`${API_URL}/api/songs/search?params=${encodeURIComponent(my_params)}`, {
            signal: controllerRef.current.signal,  // attach the abort signal
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Accept': 'application/json',
            }
        })
            .then(res => {
                if (res.status === 401 || res.status === 422) {
                    window.location.replace(
                        API_URL + '/auth/login?originalurl=' + window.location.pathname
                    )
                    return Promise.reject(new Error('Unauthorized'))
                }
                if (!res.ok) {
                    return Promise.reject(new Error(`HTTP ${res.status}`))
                }
                return res.json()
            })
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

    // get user from sessionStorage (set by JWT auth flow)
    useEffect(() => {
        const username = sessionStorage.getItem('username')
        if (username) {
            setUser({ username })
        }
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
            <button style={cornerButtonStyle('left', 'top')} onClick={() => navigate('/liked')} title="Liked Songs">♥</button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '71px'}} onClick={() => navigate('/search')} title="Search">
                <img src={searchIcon} alt="Search" style={{ width: '24px', height: '24px' }} />
            </button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '126px'}} onClick={() => navigate('/profile/' + user?.username)} title="Profile">👤</button>
            <button style={{...cornerButtonStyle('left', 'top'), left: '181px'}} onClick={() => navigate('/swipe')} title="Swipe">↔</button>
            
            <button style={{...cornerButtonStyle('right', 'top'), right: '12px'}} onClick={() => window.location.href = `${API_URL}/logoutapp`} title="Logout">
                <img src={logoutIcon} alt="Logout" style={{ width: '24px', height: '24px' }} />
            </button>
            
            <div style={{ flex: 1 }} />
            <h2>Search</h2>
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