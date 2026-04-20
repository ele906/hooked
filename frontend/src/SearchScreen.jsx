// -----------------------------------------------------------------------
// SearchScreen.jsx
// Search interface for Hooked
// Authors: Eleanor Liu
// Contributors: Lucille Rizo Patron
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react'
import {useState, useRef} from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'

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
    
    return (
        <div style={screenStyle}>
            {/* back button */}
            <button style={backButtonStyle} onClick={() => navigate('/swipe')}>
                ← Back to Main
            </button>

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
                style={{searchTabStyle}}
            />

            {/* results */}
            {results.length > 0 ? (
                results.map(song => (
                    <div key={song.song_id} style={songBox} onClick={() => navigate('/swipe', {state: {song}} )}>
                        <img src={song.song_image_url} alt={song.song_name} style={songImageBox} />
                        <span>{song.song_name} - {song.artist_name ?? 'Unknown Artist'}</span>
                    </div>
                ))
            ) : (
                <div style={noResultsStyle}>
                    <p>No results found!</p>
                </div>
            )}
        </div>
    )
}


// --------------------------------- Styles --------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    backgroundImage: `
        radial-gradient(circle at 20% 30%, rgba(158, 123, 255, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 80% 20%, rgba(68, 161, 178, 0.25) 0%, transparent 30%),
        radial-gradient(circle at 85% 85%, rgba(112, 59, 173, 0.4) 0%, transparent 30%),
        radial-gradient(circle at 15% 90%, rgba(190, 126, 194, 0.3) 0%, transparent 30%)
    `,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
}

const searchTabStyle = {
    padding: '5px', 
    borderRadius: '3px',
    width: '300px',
    fontSize: '16px',
    backgroundColor: '#bfcfea',
    color: '#1d1133',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
}

const songBox = {
    width: '400px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    backgroundColor: '#c7bdec89',
    color: '#b1ceec',
    borderRadius: '10px',
}

const songImageBox = {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
}

const noResultsStyle = {
    fontSize: '16px',
    color: '#a9bacb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
}

const backButtonStyle = {
    padding: '10px 10px',
    fontSize: '14px',
    backgroundColor: '#bfcfea',
    color: '#1d1133',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
}

export default SearchScreen