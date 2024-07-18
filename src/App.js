import './App.css';
import LoginButton from "./components/LoginButton"
import WebPlayback from './WebPlayback';

// TODO: implement logout
const client_id = 'c5f0af3c02424ce4bbcfa17926290146';
const redirect_uri = 'http://localhost:3000'; // TODO: update redirect uri when deploying

let access_token = localStorage.getItem('access_token') || null;
let refresh_token = localStorage.getItem('refresh_token') || null;
// let expires_at = localStorage.getItem('expires_at') || null; // TODO: handle token refresh

export function App() {
    const args = new URLSearchParams(window.location.search);
    let code = args.get('code');

    if (code) {
        console.log("code is present");
        exchangeToken(code);
        return (
            <div><WebPlayback></WebPlayback></div>
        )
    } else {
        console.log("code is not present - must log in");
        return (
            <div><LoginButton/></div>
        );
    }
}

function exchangeToken(code) {
    const code_verifier = localStorage.getItem('code_verifier');

    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: new URLSearchParams({
        client_id: client_id,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        code_verifier: code_verifier,
        }),
    })
    .then(addThrowErrorToFetch)
    .then((data) => {
        // clear search query params in the url
        window.history.replaceState({}, document.title, '/');

        processTokenResponse(data);
    })
    .catch(handleError);
}

// function refreshToken() {  // TODO: handle token refresh
//   fetch('https://accounts.spotify.com/api/token', {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//       },
//       body: new URLSearchParams({
//       client_id,
//       grant_type: 'refresh_token',
//       refresh_token,
//       }),
//   })
//   .then(addThrowErrorToFetch)
//   .then(processTokenResponse)
//   .catch(handleError);
// }
  
function handleError(error) { // TODO: update error handling
    console.error(error);
    console.log("error occurred: ", error.error.error_description);
    // mainPlaceholder.innerHTML = errorTemplate({
    //   status: error.response.status,
    //   message: error.error.error_description,
    // });
}

async function addThrowErrorToFetch(response) {
    if (response.ok) {
        return await response.json();
    } else {
        throw { response, error: await response.json() };
    }
}

function processTokenResponse(data) {
    access_token = data.access_token;
    refresh_token = data.refresh_token;

    // const t = new Date(); // TODO: handle token refresh
    // expires_at = t.setSeconds(t.getSeconds() + data.expires_in);

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    // localStorage.setItem('expires_at', expires_at);

    getPlaylists();
}

function getPlaylists() {
    getUserData();

    const user_id = localStorage.getItem('user_id');

    fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
        headers: {
        Authorization: 'Bearer ' + localStorage.getItem('access_token'),
        },
    })
    .then(addThrowErrorToFetch)
    .then((data) => {
        const items = data.items;
        localStorage.setItem('playlists', JSON.stringify(items));
        window.dispatchEvent(new Event('storage'));

  })
  .catch(handleError);
}


function getUserData() {
    fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: 'Bearer ' + localStorage.getItem('access_token'),
        },
    })
    .then(addThrowErrorToFetch)
    .then((data) => {
        localStorage.setItem('user_id', data.id)
    })
    .catch(handleError);
}

export default App;
