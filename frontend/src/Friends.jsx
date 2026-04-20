// -----------------------------------------------------------------------
// Friends.jsx
// friends interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import {useRef, useEffect, useState} from 'react'
import { getScreenStyle, cornerButtonStyle } from './styles'
import searchIcon from './search_button.png'
import logoutIcon from './logout_button.png'
import { useNavigate } from 'react-router-dom'
import API_URL from './config'
import './index.css'

function Friends(){

    const navigate = useNavigate()
    const [user, setUser] = useState(null) // user for cookie
    const [friendQuery, setFriendQuery] = useState("")
    const [results, setResults] = useState([])
    const controllerRef = useRef(null)

    function searchFriend(my_frd_username) {
        if (controllerRef.current !== null) {
            controllerRef.current.abort()
        }

        controllerRef.current = new AbortController()
        const accessToken = sessionStorage.getItem('accesstoken')

        fetch(`${API_URL}/api/friends/search?query=${encodeURIComponent(my_frd_username)}`, {
            signal: controllerRef.current.signal,
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
                if (Array.isArray(data.users)) {
                    setResults(data.users)
                } else {
                    setResults([])
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Search failed", err)
                    setResults([])
                }
            })
    }

    useEffect(() => {
        const username = sessionStorage.getItem('username')
        if (username) {
            setUser({ username })
        }
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
            <div className='card-header'>
                <button style={cornerButtonStyle('left', 'top')} onClick={() => navigate('/liked')} title="Liked Songs">♥</button>
                <button style={{...cornerButtonStyle('left', 'top'), left: '71px'}} onClick={() => navigate('/search')} title="Search">
                    <img src={searchIcon} alt="Search" style={{ width: '24px', height: '24px' }} />
                </button>
                <button style={{...cornerButtonStyle('left', 'top'), left: '126px'}} onClick={() => navigate('/profile/' + user?.username)} title="Profile">👤</button>
                <button style={{...cornerButtonStyle('left', 'top'), left: '181px'}} onClick={() => window.location.href = `${API_URL}/logoutapp`} title="Logout">
                    <img src={logoutIcon} alt="Logout" style={{ width: '24px', height: '24px' }} />
                </button>
                <button style={{...cornerButtonStyle('left', 'top'), left: '236px'}} onClick={() => navigate('/swipe')} title="Swipe">↔</button>
                
                <div style={{ flex: 1 }} />
                <h2>Friends</h2>
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