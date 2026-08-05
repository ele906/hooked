// -----------------------------------------------------------------------
// GenerateMusic.jsx
// Generate an original track from the user's taste profile
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */

import { useState } from 'react'
import { getScreenStyle } from './styles'
import API_URL from './config'
import Navigation from './Navigation'

function GenerateMusic() {
    if (!sessionStorage.getItem('username')) {
        window.location.replace(
            API_URL + '/auth/login?originalurl=' + window.location.pathname
        )
        return null
    }

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [timedOut, setTimedOut] = useState(false)
    const [result, setResult] = useState(null) // { audio_url, prompt }

    async function handleGenerate() {
        setLoading(true)
        setError(null)
        setTimedOut(false)
        setResult(null)

        // Generation takes ~60s on CPU but can run longer under load; some
        // hosts (e.g. Render's proxy) kill requests around 100s regardless,
        // which we detect via the 502/504 handling below. Give it up to 150s
        // client-side before giving up with a clear message.
        const controller = new AbortController()
        const abortTimer = setTimeout(() => controller.abort(), 150000)

        try {
            const response = await fetch(`${API_URL}/api/music/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            })
            if (response.status === 401 || response.status === 422) {
                window.location.replace(
                    API_URL + '/auth/login?originalurl=' + window.location.pathname
                )
                return
            }
            if (response.status === 502 || response.status === 504) {
                setTimedOut(true)
                return
            }
            let data
            try {
                data = await response.json()
            } catch {
                setTimedOut(true)
                return
            }
            if (!response.ok) {
                setError(data.error || 'Something went wrong generating your track.')
                return
            }
            setResult(data)
        } catch (err) {
            if (err.name === 'AbortError') {
                setTimedOut(true)
            } else {
                setError('Something went wrong generating your track.')
            }
        } finally {
            clearTimeout(abortTimer)
            setLoading(false)
        }
    }

    return (
        <div style={{
            ...getScreenStyle(
                'rgba(158, 123, 255, 0.4)',
                'rgba(217, 184, 227, 0.25)',
                'rgba(186, 151, 225, 0.4)',
                'rgba(219, 185, 210, 0.3)'
            ),
            color: '#debff7'
        }}>
            <Navigation />

            <h1>Generate Your Sound</h1>
            <p style={{ maxWidth: '400px', textAlign: 'center', color: '#ffffffcc', fontSize: '14px' }}>
                We'll compose a short original track based on your favorite genres and artists.
            </p>

            <button
                className="btn-1"
                onClick={handleGenerate}
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}
            >
                {loading ? 'Composing… (can take a couple minutes)' : 'Generate'}
            </button>

            {error && (
                <p style={{ color: '#ff8a8a', fontSize: '14px', maxWidth: '400px', textAlign: 'center' }}>
                    {error}
                </p>
            )}

            {timedOut && (
                <div style={{
                    marginTop: '12px',
                    backgroundColor: '#1d1133',
                    border: '2px solid #ff8a8a',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '14px', color: '#ffffffcc', marginBottom: '12px' }}>
                        This is taking longer than expected and timed out.
                    </p>
                    <p style={{ fontSize: '13px', color: '#ffffffaa' }}>
                        Generation can take a couple of minutes — try again in a bit.
                    </p>
                </div>
            )}

            {result && (
                <div style={{
                    marginTop: '12px',
                    backgroundColor: '#1d1133',
                    border: '2px solid #debff7',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '13px', color: '#ffffffcc', marginBottom: '12px' }}>
                        "{result.prompt}"
                    </p>
                    <audio controls loop src={result.audio_url} style={{ width: '100%' }} />
                </div>
            )}
        </div>
    )
}

export default GenerateMusic
