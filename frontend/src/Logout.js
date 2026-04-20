function Logout() {
    sessionStorage.setItem('accesstoken', '')
    sessionStorage.setItem('refreshtoken', '')
    sessionStorage.setItem('username', '')
    return (
        <div>
            <h2>You are logged out of Hooked.</h2>
            Click to <a href="/">revisit the app</a>
        </div>
    )
}
export default Logout