import React, { Component } from "react";
const client_id = 'c5f0af3c02424ce4bbcfa17926290146';
const redirect_uri = 'http://localhost:3000'; // TODO: update redirect uri when deploying

export default class LoginButton extends Component {
    render() {
        return (
            <div>
                <button id="login-button" onClick={() => this.redirectToSpotifyAuthorizeEndpoint()}>Log in with Spotify</button>
            </div>
        );
    };

    redirectToSpotifyAuthorizeEndpoint = () => {
        let codeVerifier = this.generateRandomString(64);

        this.generateCodeChallenge(codeVerifier).then((code_challenge) => {
        window.localStorage.setItem('code_verifier', codeVerifier);
        console.log("code verifier:", localStorage.getItem('code_verifier'));

        window.location =
        this.generateUrlWithSearchParams(
            'https://accounts.spotify.com/authorize',
            {
            response_type: 'code',
            client_id,
            scope: "streaming user-read-email user-read-private playlist-read-private playlist-read-collaborative user-modify-playback-state",
            code_challenge_method: 'S256',
            code_challenge,
            redirect_uri,
            },
        );
        });
    };

    generateRandomString = (length) => {
        let text = '';
        const possible =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      
        for (let i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        console.log(text);
        return text;
      }
      
    generateCodeChallenge = async (codeVerifier) => {
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(codeVerifier),
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    }
    
    generateUrlWithSearchParams = (url, params) => {
        const urlObject = new URL(url);
        urlObject.search = new URLSearchParams(params).toString();
        
        return urlObject.toString();
    }

    handleError = (error) => { // TODO: update error handling
        console.error(error);
        // mainPlaceholder.innerHTML = errorTemplate({
        //   status: error.response.status,
        //   message: error.error.error_description,
        // });
    }
    
    addThrowErrorToFetch = async (response) => {
        if (response.ok) {
            return response.json();
        } else {
            throw { response, error: await response.json() };
        }
    }
}