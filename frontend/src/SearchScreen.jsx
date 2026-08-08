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
    const [decades, setDecades] = useState([])
    const [decade, setDecade] = useState("")
    const [totalResults, setTotalResults] = useState(0)
    const RESULTS_PER_PAGE = 10

    function searchSong(my_params, my_genre, my_decade, page) {
        // abort previous request if one is running
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        // nothing to search for
        if (!my_params && !my_genre && !my_decade) {
            setResults([])
            setTotalResults(0)
            return
        }

        // start a new one
        controllerRef.current = new AbortController()

        const accessToken = sessionStorage.getItem('accesstoken')

        const url = `${API_URL}/api/songs/search?params=${encodeURIComponent(my_params)}`
            + (my_genre ? `&genre=${encodeURIComponent(my_genre)}` : '')
            + (my_decade ? `&decade=${encodeURIComponent(my_decade)}` : '')
            + `&page=${page + 1}&per_page=${RESULTS_PER_PAGE}`

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
                if (data && Array.isArray(data.results)) {
                    setResults(data.results)
                    setTotalResults(data.total ?? data.results.length)
                } else {
                    setResults([])  // if not the expected shape, just set empty
                    setTotalResults(0)
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

    // fetch the fixed decade list for the filter dropdown
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accesstoken')
        fetch(`${API_URL}/api/decades`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Accept': 'application/json',
            }
        })
            .then(res => res.ok ? res.json() : [])
            .then(data => setDecades(Array.isArray(data) ? data : []))
            .catch(() => setDecades([]))
    }, [])

    // refetch the current page when the user navigates via the pager
    useEffect(() => {
        if (!query && !genre && !decade) return
        searchSong(query, genre, decade, currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage])

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
                        searchSong(e.target.value, genre, decade, 0)
                    }}
                    placeholder="Search songs..."
                    className = 'search-bar'
                />
                <select
                    value={genre}
                    onChange={(e) => {
                        setGenre(e.target.value)
                        setCurrentPage(0)
                        searchSong(query, e.target.value, decade, 0)
                    }}
                    className = 'search-genre-select'
                >
                    <option value="">All genres</option>
                    {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                </select>
                <select
                    value={decade}
                    onChange={(e) => {
                        setDecade(e.target.value)
                        setCurrentPage(0)
                        searchSong(query, genre, e.target.value, 0)
                    }}
                    className = 'search-genre-select'
                >
                    <option value="">All decades</option>
                    {decades.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            {/* results */}
            {results.length > 0 ? (
                (() => {
                    const totalPages = Math.max(1, Math.ceil(totalResults / RESULTS_PER_PAGE))
                    const hasNextPage = currentPage < totalPages - 1
                    const hasPrevPage = currentPage > 0

                    // build the list of page numbers to show, with '...' gaps
                    const pageNumbers = []
                    const addPage = p => pageNumbers.push(p)
                    const current = currentPage + 1 // 1-indexed for display
                    addPage(1)
                    if (current - 1 > 2) pageNumbers.push('...')
                    for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) {
                        addPage(p)
                    }
                    if (current + 1 < totalPages - 1) pageNumbers.push('...')
                    if (totalPages > 1) addPage(totalPages)

                    return (
                        <>
                            <div className="results-list">
                                {results.map(song => (
                                    <div key={song.song_id} className="search-song-box" onClick={() => navigate('/swipe', {state: {song}})}>
                                        <img src={song.song_image_url} alt={song.song_name} className="song-img-box"/>
                                        <span>{song.song_name} - {song.artist_name ?? 'Unknown Artist'}</span>
                                    </div>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={!hasPrevPage}
                                        style={{ opacity: hasPrevPage ? 1 : 0.3, background: 'none', border: 'none', color: '#bfc3f7', fontSize: '18px', cursor: hasPrevPage ? 'pointer' : 'default' }}
                                    >‹</button>
                                    {pageNumbers.map((p, i) => (
                                        p === '...' ? (
                                            <span key={`ellipsis-${i}`} style={{ color: '#bfc3f7', fontSize: '14px', padding: '0 4px' }}>…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p - 1)}
                                                style={{
                                                    minWidth: '28px',
                                                    background: p === current ? '#bfc3f7' : 'none',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: p === current ? '#2c2b52' : '#bfc3f7',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    padding: '4px 8px',
                                                    cursor: 'pointer'
                                                }}
                                            >{p}</button>
                                        )
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={!hasNextPage}
                                        style={{ opacity: hasNextPage ? 1 : 0.3, background: 'none', border: 'none', color: '#bfc3f7', fontSize: '18px', cursor: hasNextPage ? 'pointer' : 'default' }}
                                    >›</button>
                                </div>
                            )}
                        </>
                    )
                })()
            ) : (
                (query || genre || decade) && <div className='no-results'>
                    <p>No results found!</p>
                </div>
            )}
            </div>
        </div>
    )
}

// -------------------- EXPORT --------------------
export default SearchScreen