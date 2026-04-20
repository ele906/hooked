import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import API_URL from './config'
import '@fontsource/outfit'
import './index.css'

const params = new URLSearchParams(window.location.search)
const nonce = params.get('nonce')

function renderApp() {
    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(<App />)
}

function getTokens() {
    function handleResponse() {
        if (this.status !== 200) {
            alert(this.status + ': ' + this.statusText)
            renderApp()
            return
        }
        const tokens = JSON.parse(this.response)
        sessionStorage.setItem('username', tokens[0])
        sessionStorage.setItem('accesstoken', tokens[1])
        sessionStorage.setItem('refreshtoken', tokens[2])
        renderApp()
    }
    function handleError() { 
        alert(this.status + ': ' + this.statusText)
        renderApp()
    }

    const url = API_URL + '/api/gettokens?nonce=' + nonce
    const req = new XMLHttpRequest()
    req.onload = handleResponse
    req.onerror = handleError
    req.open('GET', url)
    req.setRequestHeader('Accept', 'application/json')
    req.setRequestHeader('Content-type', 'application/json')
    req.send()
}

if (nonce !== null) {
    getTokens()
} else {
    renderApp()
}
