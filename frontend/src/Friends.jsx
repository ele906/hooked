// -----------------------------------------------------------------------
// Friends.jsx
// friends interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import {useRef, useEffect, useState} from 'react'
import { getScreenStyle } from './styles'
import { useNavigate } from 'react-router-dom'
import './index.css'

function Friends(){

    const navigate = useNavigate()
    const [user, setUser] = useState(null) // user for cookie
    const [friendQuery, setFriendQuery] = useState("")
    const [results, setResults] = useState("")
    const controllerRef = useRef(null)
    
    function handleBackButton() {
        console.log("back button clicked, go back to swipe page")
        navigate(-1)
    }

    function handleHomeButton(){
        console.log("back to home page")
        navigate("/swipe")
    }

    function searchFriend(my_frd_username) {
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        controllerRef.current = new AbortController()

        fetch(`http://localhost:5000/api/friends/search?query=${encodeURIComponent(my_frd_username)}`, {
            signal: controllerRef.current.signal,
            credentials: "include" 
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.users)) {
                    setResults(data.users)
                } else {
                    setResults([])
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Search failed", err)
                }
            })
    }

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
            'rgba(178, 201, 221, 0.4)',
            'rgba(214, 163, 226, 0.25)',
            'rgba(167, 202, 224, 0.4)',
            'rgba(190, 126, 194, 0.3)'),
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#debff7'}}>
        
            <div className='card'>
            <div className='card-header-2' style={{ paddingBottom: 0 }}> 
                {user && <p style={{ color: '#debff7', fontWeight: 'bold', cursor: 'pointer' }} 
                onClick={() => navigate(`/profile/${user.username}`)}>Welcome, {user.username}!</p>}
            </div>
            <div className='small-header' style={{ marginTop: 0 }}>
                <h1>Friends</h1>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className='back-btn' onClick={() => navigate("/swipe")}>Home</button>
                    <button className='back-btn' onClick={() => navigate(-1)}>Back</button>
                </div>
            </div>

            <input
                type="text"
                value={friendQuery}
                onChange={(e) => {
                    setFriendQuery(e.target.value)
                    searchFriend(e.target.value)
                }}
                placeholder="Search Username"
                className = 'input-box-3'
            />

            {/* results */}
            {results.length > 0 ? (
                <div className="results-list">
                    {results.map(usr => (
                        <div key={usr.user_id} className="search-song-box" onClick={() => navigate(`/profile/${usr.username}`, {state: {usr}})}>
                            <img src={usr.user_image_url} alt='👤' className="song-img-box"/>
                            <span>{usr.username} </span>
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
    );
}

// -------------------- EXPORT --------------------
export default Friends