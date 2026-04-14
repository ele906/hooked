// -----------------------------------------------------------------------
// Friends.jsx
// friends interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import {useCallback, useEffect, useState} from 'react'
import { getScreenStyle } from './styles'
import { useNavigate } from 'react-router-dom'
import './index.css'

function Friends(){

    const navigate = useNavigate()
    const [friendUsername, setFriendUsername] = useState("")
    const [likedSongs, setLikedSongs] = useState([]);

    function handleBackButton() {
        console.log("back button clicked, go back to sw9pe page")
        navigate(-1)
    }

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
                <h1>Friends</h1>

                <button className = 'back-btn' onClick={handleBackButton}>
                    Back
                </button>
            </div>
                    
            <input
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                placeholder="Search Username"
                className = 'input-box-3'
            />


            </div>
        </div>
    );
}

// -------------------- EXPORT --------------------
export default Friends