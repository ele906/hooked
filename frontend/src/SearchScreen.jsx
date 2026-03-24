// -----------------------------------------------------------------------
// SwipeScreen.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------
import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

function SearchScreen() {
    const navigate = useNavigate()
    const [results, setResults] = useState([])
    const [query, setQuery] = useState("")
    const controllerRef = useRef(null)

    function searchSong(my_params) {
        // abort previous request if one is running
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        // start a new one
        controllerRef.current = new AbortController()

        fetch(`http://localhost:5000/api/songs/search?params=${encodeURIComponent(my_params)}`, {
            signal: controllerRef.current.signal  // attach the abort signal
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
    
    return (
        <div style={screenStyle}>
            {/* back button */}
            <button style={backButtonStyle} onClick={() => navigate('/')}>
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
            {if (results.length != 0) {results.map(song => (
                <p key={song.song_id} style={resultsStyle}>
                    {song.song_name} - {song.artist_name}
                </p>
            ))}}
        </div>
    )
}

// --------------------------------- Styles --------------------------------

const screenStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
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
    borderRadius: '50px',
    cursor: 'pointer',
}

const resultsStyle = {
    minHeight: '100vh',
    backgroundColor: '#18171d',
    fontSize: '16px',
    color: '#a9bacb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'left',
    justifyContent: 'left',
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