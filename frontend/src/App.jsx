import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SwipeScreen from './SwipeScreen'
import SearchScreen from "./SearchScreen"
import WelcomePage from './WelcomePage'
import SignUp from './SignUp'
import Login from './Login'
import LikedSongs from './LikedSongs'
import SeedPreferences from './SeedPreferences'
import Friends from './Friends'
import Profile from './Profile'
import { AuthProvider } from './AuthContext'      // ADD
import ProtectedRoute from './ProtectedRoute'     // ADD
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import VerifyEmail from './VerifyEmail'
import ForgotUsername from './ForgotUsername'
import { useEffect } from 'react'
import API_URL from './config'
import Logout from './Logout'
import GenerateMusic from './GenerateMusic'



function App() {
    function refreshAccessToken() {
        if (!sessionStorage.getItem('accesstoken')) return
        function handleResponse() {
            if (this.status !== 200) return
            sessionStorage.setItem('accesstoken', JSON.parse(this.response))
        }
        const req = new XMLHttpRequest()
        req.onload = handleResponse
        req.open('POST', API_URL + '/api/refreshaccesstoken')
        req.setRequestHeader('Authorization', 'Bearer ' + sessionStorage.getItem('refreshtoken'))
        req.setRequestHeader('Accept', 'application/json')
        req.setRequestHeader('Content-type', 'application/json')
        req.send()
    }

    useEffect(() => {
        const interval = setInterval(refreshAccessToken, 1800000) // 30 min
        return () => clearInterval(interval)
    }, [])
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* public — no login needed */}
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/forgot-username" element={<ForgotUsername />} />
                    <Route path="/logout" element={<Logout />} />

                    {/* protected — must be logged in */}
                    <Route path="/swipe" element={<ProtectedRoute><SwipeScreen /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
                    <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
                    <Route path="/seedprefs" element={<ProtectedRoute><SeedPreferences /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                    <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/generate" element={<ProtectedRoute><GenerateMusic /></ProtectedRoute>} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App