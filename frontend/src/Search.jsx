// -----------------------------------------------------------------------
// SwipeScreen.jsx
// Swipe interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------
import React from 'react'
import {useState, useRef, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'

function Search() {
    const [results, setResults] = useState([])
    const controllerRef = useRef(null)  // request null

    function searchSong(my_song_name) {
        // abort previous request if one is running
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        // start a new one
        controllerRef.current = new AbortController()

        fetch(`http://localhost:5000/api/songs/search?song_name=${encodeURIComponent(my_song_name)}`, {
            signal: controllerRef.current.signal  // attach the abort signal
        })
            .then(res => res.json())
            .then(data => {
                setResults(data)
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Search failed", err)
                }
            })
    }

    return (
        <div>
            <input 
                type="text" 
                onChange={(e) => searchSong(e.target.value)} 
                placeholder="Search songs..."
            />
            {results.map(song => (
                <p key={song.song_id}>{song.song_name} - {song.artist_name}</p>
            ))}
        </div>
    )
}