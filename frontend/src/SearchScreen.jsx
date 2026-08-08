// -----------------------------------------------------------------------
// SearchScreen.jsx
// Search interface for Hooked (in progress)
// Authors: Eleanor Liu, Lucille Rizo Patron
// -----------------------------------------------------------------------

import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'
import { getScreenStyle, cornerButtonStyle } from './styles'
import Navigation from "./Navigation"
import './index.css'

function SearchScreen() {
    const navigate = useNavigate()
    const [results, setResults] = useState([])
    const [query, setQuery] = useState("")
    const [user, setUser] = useState(null)
    const controllerRef = useRef(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [genres, setGenres] = useState([])
    const [genre, setGenre] = useState("")
    const RESULTS_PER_PAGE = 10

    function searchSong(my_params, my_genre) {
        // abort previous request if one is running
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        // nothing to search for
        if (!my_params && !my_genre) {
            setResults([])
            return
        }

        // start a new one
        controllerRef.current = new AbortController()

        const accessToken = sessionStorage.getItem('accesstoken')

        const url = `${API_URL}/api/songs/search?params=${encodeURIComponent(my_params)}`
            + (my_genre ? `&genre=${encodeURIComponent(my_genre)}` : '')

        fetch(url, {
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

    // fetch the fixed genre list for the filter dropdown
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accesstoken')
        fetch(`${API_URL}/api/genres`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Accept': 'application/json',
            }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setGenres(Array.isArray(data) ? data : []))
            .catch(() => setGenres([]))
    }, [])
    
    return (
        <div style = {{...getScreenStyle(
            'rgba(125, 123, 255, 0.4)',
            'hsla(229, 100%, 81%, 0.50)',
            'rgba(173, 151, 225, 0.4)',
            'rgba(94, 169, 255, 0.45)'),
            color: '#debff7'}}>
            
            <Navigation />

            <div className="search-card">
            <div className="welcome-user-message"> 
                {user && ( 
                    <div 
                        onClick={() => navigate(`/profile/${user.username}`)}>
                        Welcome, {user.username}!
                    </div> 
                )}
            </div>

            <div className='search-header-style'>
                Search
            </div>
            

            {/* search bar + genre filter */}
            <div className="search-bar-row" style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={query}
                    // this detects changes in search and does the search function...
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setCurrentPage(0)
                        searchSong(e.target.value, genre)
                    }}
                    placeholder="Search songs..."
                    className = 'search-bar'
                />
                <select
                    value={genre}
                    onChange={(e) => {
                        setGenre(e.target.value)
                        setCurrentPage(0)
                        searchSong(query, e.target.value)
                    }}
                    className = 'search-genre-select'
                >
                    <option value="">All genres</option>
                    {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
            </div>

            {/* results */}
            {results.length > 0 ? (
                (() => {
                    const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE)
                    const paginatedResults = results.slice(currentPage * RESULTS_PER_PAGE, (currentPage + 1) * RESULTS_PER_PAGE)
                    const hasNextPage = currentPage < totalPages - 1
                    const hasPrevPage = currentPage > 0
                    return (
                        <>
                            <div className="results-list">
                                {paginatedResults.map(song => (
                                    <div key={song.song_id} className="search-song-box" onClick={() => navigate('/swipe', {state: {song}})}>
                                        <img src={song.song_image_url} alt={song.song_name} className="song-img-box"/>
                                        <span>{song.song_name} - {song.artist_name ?? 'Unknown Artist'}</span>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '16px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={!hasPrevPage}
                                        style={{ opacity: hasPrevPage ? 1 : 0.3, background: 'none', border: 'none', color: '#bfc3f7', fontSize: '20px', cursor: hasPrevPage ? 'pointer' : 'default' }}
                                    >‹ Prev</button>
                                    <span style={{ color: '#bfc3f7', fontSize: '14px', fontWeight: 'bold' }}>
                                        Page {currentPage + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={!hasNextPage}
                                        style={{ opacity: hasNextPage ? 1 : 0.3, background: 'none', border: 'none', color: '#bfc3f7', fontSize: '20px', cursor: hasNextPage ? 'pointer' : 'default' }}
                                    >Next ›</button>
                                </div>
                            )}
                        </>
                    )
                })()
            ) : (
                (query || genre) && <div className='no-results'>
                    <p>No results found!</p>
                </div>
            )}
            </div>
        </div>
    )
}

// -------------------- EXPORT --------------------
export default SearchScreen