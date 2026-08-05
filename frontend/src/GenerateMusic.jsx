// -----------------------------------------------------------------------
// GenerateMusic.jsx
// Generate an original track from the user's taste profile
// -----------------------------------------------------------------------
/* eslint-disable react-hooks/rules-of-hooks */

import { useState, useEffect } from 'react'
import { getScreenStyle } from './styles'
import API_URL from './config'
import Navigation from './Navigation'

// Editable clip name: shows a text input, saves on blur/Enter via onRename.
function ClipName({ clip, onRename }) {
    const [value, setValue] = useState(clip.name || '')

    useEffect(() => { setValue(clip.name || '') }, [clip.clip_id, clip.name])

    function save() {
        const trimmed = value.trim()
        if (trimmed !== (clip.name || '')) {
            onRename(clip.clip_id, trimmed)
        }
    }

    return (
        <input
            type="text"
            value={value}
            placeholder="Name this track…"
            onChange={e => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            maxLength={100}
            style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid #debff755',
                color: '#debff7',
                fontSize: '15px',
                fontWeight: 'bold',
                padding: '4px 2px',
                marginBottom: '8px',
                outline: 'none',
            }}
        />
    )
}

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
    const [history, setHistory] = useState([]) // [{ audio_url, prompt, created_at }]

    const authHeaders = {
        'Authorization': 'Bearer ' + sessionStorage.getItem('accesstoken'),
        'Accept': 'application/json',
    }

    useEffect(() => {
        fetch(`${API_URL}/api/music/history`, { headers: authHeaders })
            .then(res => res.ok ? res.json() : null)
            .then(data => data && setHistory(data.clips))
            .catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function renameClip(clipId, name) {
        // optimistic update
        setResult(prev => (prev && prev.clip_id === clipId) ? { ...prev, name } : prev)
        setHistory(prev => prev.map(c => c.clip_id === clipId ? { ...c, name } : c))

        try {
            await fetch(`${API_URL}/api/music/history/${clipId}`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
        } catch {
            // best-effort; the name stays edited locally even if the save request failed
        }
    }

    function redirectToLogin() {
        window.location.replace(
            API_URL + '/auth/login?originalurl=' + window.location.pathname
        )
    }

    const POLL_INTERVAL_MS = 3000
    const MAX_WAIT_MS = 5 * 60 * 1000 // generation is CPU-bound and can legitimately take minutes

    async function pollJob(jobId, startedAt) {
        if (Date.now() - startedAt > MAX_WAIT_MS) {
            setTimedOut(true)
            setLoading(false)
            return
        }

        let response
        try {
            response = await fetch(`${API_URL}/api/music/generate/status/${jobId}`, {
                headers: authHeaders,
            })
        } catch {
            setTimeout(() => pollJob(jobId, startedAt), POLL_INTERVAL_MS)
            return
        }

        if (response.status === 401 || response.status === 422) {
            redirectToLogin()
            return
        }

        const data = await response.json().catch(() => null)

        if (response.status === 502 || (data && data.status === 'error')) {
            setError((data && data.error) || 'Something went wrong generating your track.')
            setLoading(false)
            return
        }

        if (data && data.status === 'done') {
            setResult(data)
            setHistory(prev => [
                { clip_id: data.clip_id, audio_url: data.audio_url, prompt: data.prompt, name: data.name, created_at: new Date().toISOString() },
                ...prev,
            ])
            setLoading(false)
            return
        }

        // still pending
        setTimeout(() => pollJob(jobId, startedAt), POLL_INTERVAL_MS)
    }

    async function handleGenerate() {
        setLoading(true)
        setError(null)
        setTimedOut(false)
        setResult(null)

        try {
            const response = await fetch(`${API_URL}/api/music/generate`, {
                method: 'POST',
                headers: authHeaders,
            })
            if (response.status === 401 || response.status === 422) {
                redirectToLogin()
                return
            }
            const data = await response.json().catch(() => null)
            if (!response.ok || !data || !data.job_id) {
                setError((data && data.error) || 'Something went wrong generating your track.')
                setLoading(false)
                return
            }
            pollJob(data.job_id, Date.now())
        } catch (err) {
            setError('Something went wrong generating your track.')
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
                    <ClipName clip={result} onRename={renameClip} />
                    <p style={{ fontSize: '13px', color: '#ffffffcc', marginBottom: '12px' }}>
                        "{result.prompt}"
                    </p>
                    <audio controls loop src={result.audio_url} style={{ width: '100%' }} />
                </div>
            )}

            {history.length > 0 && (
                <div style={{ marginTop: '24px', maxWidth: '400px', width: '100%' }}>
                    <h3 style={{ fontSize: '15px', textAlign: 'center', color: '#ffffffcc' }}>
                        Your previous tracks
                    </h3>
                    {history.map((clip) => (
                        <div key={clip.clip_id} style={{
                            marginTop: '10px',
                            backgroundColor: '#1d1133',
                            border: '1px solid #debff755',
                            borderRadius: '12px',
                            padding: '14px',
                        }}>
                            <ClipName clip={clip} onRename={renameClip} />
                            <p style={{ fontSize: '12px', color: '#ffffffaa', marginBottom: '8px' }}>
                                "{clip.prompt}"
                            </p>
                            <audio controls src={clip.audio_url} style={{ width: '100%' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GenerateMusic
