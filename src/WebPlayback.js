import React, { useState, useEffect } from 'react';

var uri_queue = [] 
// TODO: 
// what should happen when a user switches playlists to shuffle? or starts playing something else? 

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

async function getPlaylistItems(playlist_id, token, player) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        headers: {
            'Authorization': `Bearer ${token}`
          }
    });
    const json = await response.json();
    const items = json.items
    items.forEach(item => {
        const track_uri = item.track.uri
        uri_queue.push(track_uri)
    });

    shuffle(uri_queue)

    await addToQueue(token, uri_queue, player);
    player.nextTrack() // even though this should technically 'await' the previous line, 
    // after the first song is added from addToQueue, Spotify probably detects that there are 
    // already songs added to the queue that it can play.
}

async function addToQueue(token, tracks_left) {
    if (tracks_left.length > 0) {
        const track_uri = tracks_left.pop()
        const requestOptions = {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        try {
            const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(track_uri)}`, requestOptions);
            if (!response.ok) {
                const error = await response.json();
                console.error('Error:', error);
            } else {
                console.log('Track added to queue successfully');
                addToQueue(token, tracks_left)
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    } else {
        uri_queue = []
    }
}

function shuffle(array) {
    // Fisher-Yates shuffling algorithm

    // start from last element.
    // swap the current element with a random element before the current one.
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function WebPlayback() {

    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);

    const [playlists, setPlaylists] = useState([]);

    const access_token = localStorage.getItem('access_token');

    useEffect(() => { // creates instance of the Web Playback SDK object before page is rendered for the first time        
        function beginPlayback() {

            const local_playlists = localStorage.getItem('playlists');

            if (local_playlists) {
                setPlaylists(JSON.parse(local_playlists));     
            }

            // install the SDK
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js"; // load the library into a new <script> tag
            script.async = true;

            document.body.appendChild(script); // add <script> tag to the DOM body

            // set up an event handler function for the onSpotifyWebPlaybackSDKReady event on the window object.
            
            // onSpotifyWebPlaybackSDKReady is a custom Spotify SDK method that is automatically 
            // called when when the Web Playback SDK successfully loads.

            // by assigning a function to window.onSpotifyWebPlaybackSDKReady, we tell the browser
            // to call this function when the Web Playback SDK loads.
            
            // window object:  the global object in a browser environment, representing the window containing the DOM document
            window.onSpotifyWebPlaybackSDKReady = () => {

                const player = new window.Spotify.Player({
                    name: 'Web Playback SDK',
                    getOAuthToken: cb => { cb(access_token); },
                    volume: 0.5
                });

                setPlayer(player);

                player.addListener('ready', ({ device_id }) => {
                    console.log('Ready with Device ID', device_id);
                });

                player.addListener('not_ready', ({ device_id }) => {
                    console.log('Device ID ', device_id, ' has gone offline');
                });

                player.addListener('player_state_changed', ( state => {

                    if (!state) {
                        return;
                    }

                    setTrack(state.track_window.current_track);
                    setPaused(state.paused);

                    player.getCurrentState().then( state => { 
                        (!state)? setActive(false) : setActive(true) 
                    });

                }));

                player.connect();
            };
        }

        // call beginPlayback() when local storage changes
        window.addEventListener('storage', beginPlayback);

        return () => {
            window.removeEventListener('storage', beginPlayback)
        }
    }, []);

    if (!is_active) { 
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">
                        <b> Instance not active. Transfer your playback to "Web Playback SDK" using your Spotify app </b>
                    </div>
                </div>
            </>)
    } else {
        return (
            <>
                <div className="container">

                <div className="main-wrapper">

                    <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                        <div className="now-playing__side">
                            <div className="now-playing__name">{current_track.name}</div>
                            <div className="now-playing__artist">{current_track.artists[0].name}</div>

                            <button className="spotify-button" onClick={() => { player.previousTrack() }} >
                                &lt;&lt;
                            </button>

                            <button className="spotify-button" onClick={() => { 
                                player.togglePlay() 
                                console.log(playlists)
                                }} >
                                { is_paused ? "PLAY" : "PAUSE" }
                            </button>

                            <button className="spotify-button" onClick={() => { player.nextTrack() }} >
                                &gt;&gt;
                            </button>
                        </div>
                    </div>   

                    <div className="playlists">
                        <h3>My Playlists</h3>
                            <br></br>
                            <ul>
                                {playlists.map((playlist) => (
                                    <li className="playlist-item" key={playlist.id}>
                                        <button onClick={() => { 
                                                player.pause()
                                                console.log('playlist id: ', playlist.id)
                                                getPlaylistItems(playlist.id, access_token, player)
                                            }}>
                                            {"Shuffle and play " + playlist.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                    </div>
                </div>
            </>
        );
    }
}

export default WebPlayback