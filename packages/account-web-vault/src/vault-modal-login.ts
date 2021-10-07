import AuthClient from './auth-client';

// @ts-ignore
import Sora from './assets/fonts/Sora-Regular.ttf';
import VeridaVaultImage from './assets/open_verida_vault_dark.png';

import { AuthClientConfig, VaultModalLoginConfig } from './interfaces';
const _ = require('lodash');
const store = require('store');

const VERIDA_AUTH_CONTEXT = '_verida_auth_context'

export default async function (contextName: string, config: VaultModalLoginConfig) {
  const authConfig: AuthClientConfig = _.merge({
    loginUri: 'https://vault.verida.io/request/',
    canvasId: 'verida-auth-client-canvas',
    context: contextName
  }, config)

  const modalHTML = `
  <div id="verida-modal" hidden="true" class="verida-modal-wrapper">
    <div class="verida-modal-container">
      <div class="verida-modal-header" id="verida-modal-header">
        <img class="verida-modal-logo" src="https://assets.verida.io/verida_vault_logo.svg" alt="verida logo">
        <span class="verida-modal-close" id="verida-modal-close">&times;</span>
      </div>
      <div class="verida-modal-body">
        <div>
          <div class="desktop-content">
            <h3 class="verida-modal-title desktop">
              Scan this QR code on your mobile phone to login or signup
            </h3>
            <label class="verida-checkbox">
              <span class="verida-checkbox-input">
                <input type="checkbox" name="checkbox" id="verida-checked" checked>
                <span class="verida-checkbox-control">
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden="true" focusable="false">
                    <path fill='none' stroke='currentColor' stroke-width='3' d='M1.73 12.91l6.37 6.37L22.79 4.59' />
                  </svg>
                </span>
              </span>
              <span class="verida-radio-label">Remember my login </span>
            </label>
          </div>
        </div>
        <div class="desktop-content">
           <canvas id="verida-auth-client-canvas" class="verida-modal-qr"></canvas><img src="" alt="" id="image" />
        </div>
        <div class="mobile-content">
          <h3 class="verida-modal-title mobile">
            Connect now
          </h3>
          <p class="verida-body-content">Use the button below to connect with Verida Vault app to login or sign up</p>
          <a href="#" id="verida-auth-client-deeplink"><img src="${VeridaVaultImage}" alt="Verida Vault App" /></>
        </div>
      </div>
    </div>
  </div>

    <style>
    @font-face {
      font-family: "Sora";
      src: url(${Sora}) format("truetype");
    }

     #verida-auth-client-canvas {
      width: 287px !important;
      height: 287px !important;
    }

    .verida-modal-wrapper {
      display: none;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 9999;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #E5E5E5;
    }

    .verida-modal-container {
      margin: 3% auto;
      border-radius: 14.35px;
      background-image: url("https://assets.verida.io/verida_bg.png");
      background-position: 50% 100%;
      background-size: cover;
      width: 800px;
      height: 483px;
      font-family: Sora, Avenir, Helvetica, Arial, sans-serif;
      font-weight: 700;
      box-shadow: 0px 35px 45px rgba(7, 14, 39, 0.05);
    }

    .verida-modal-body {
      display: flex;
      margin: 1rem 4rem;
      padding: 0.2rem;
      align-items: center;
      justify-content: center;
    }

    .verida-modal-qr {
      margin: 0.8rem 0.3rem 1rem 1rem;
      background: #FFFFFF;
      border-radius: 14.35px;
      padding: 0.8rem;
      box-shadow: 0px 35px 45px rgba(7, 14, 39, 0.05);
    }

    .verida-modal-header {
      display: flex;
      padding: 5px;
      justify-content: space-between;
      margin: 1.3rem 0.4rem 0 0.4rem;
    }

    .verida-modal-title {
      font-family: Sora;
      font-style: normal;
      font-weight: 700;
      font-size: 32px;
      line-height: 40px;
      letter-spacing: -0.03em;
      color: #111111;
    }

    .verida-body-content {
      font-family: Sora;
      font-style: normal;
      font-weight: 500;
      font-size: 16px;
      line-height: 30px;
      letter-spacing: 0.2px;
      color: rgba(17, 17, 17, 0.7);
    }

    .verida-modal-body-title {
      padding: 0 0.9rem;
      align-items: center;
      justify-content: center;
      display: flex;
    }

    .verida-button {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 16px 48px;

      width: 295.91px;
      height: 56px;

      background: #111111;
      border-radius: 8px;
    }

    .verida-modal-close {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #041133;
      width: 30px;
      height: 30px;
      font-size: 26px;
      font-weight: lighter;
      background: #E0E3EA;
      opacity: 0.5;
      backdrop-filter: blur(54.3656px);
      border-radius: 50%;
      margin: 0.5em 0 0 0;
    }

    .verida-modal-logo {
      margin: 0.8rem 3.5rem 0 3.5rem;
    }

    .verida-modal-close:hover,
    .verida-modal-close:focus {
      color: black;
      text-decoration: none;
      cursor: pointer;
    }

    .verida-checkbox {
      display: grid;
      grid-template-columns: min-content auto;
      grid-gap: 0.5em;
      color: #423BCE;
      margin: 32px 0;
    }

    .verida-checkbox-control {
      display: inline-grid;
      width: 24px;
      height: 24px;
      background: #FFFFFF;
      border: 1px solid #E0E3EA;
      box-sizing: border-box;
      border-radius: 4px;
    }

    .verida-checkbox-control svg {
      transition: transform 0.1s ease-in 25ms;
      transform: scale(0);
      transform-origin: bottom left;
    }

    .verida-checkbox-input {
      display: grid;
      grid-template-areas: "checkbox";
    }

    .verida-checkbox-input>* {
      grid-area: checkbox;
    }

    .verida-checkbox-input input {
      opacity: 0;
      width: 1em;
      height: 1em;
    }

    .verida-checkbox-input input:checked+.verida-checkbox-control svg {
      transform: scale(1);
    }

    .verida-radio-label {
      font-size: 14px;
      line-height: 26px;
      font-weight: 400;
      letter-spacing: 0.2px;
      font-family: Sora;
      color: rgba(17, 17, 17, 0.7);
    }


   @media screen and (max-width: 768px) {
      .verida-modal-qr {
        margin: auto;
      }

      .verida-modal-container {
        width: 100%;
        height: 100%;
      }

      .verida-modal-body {
        flex-direction: column;
        margin: 2rem 1.2rem;
      }

      .verida-modal-logo {
        margin: 0.8rem 3.5rem 0 0.6rem;
      }

      .verida-modal-title {
        font-size: 28px;
        text-align: center;
        font-weight: 700;
        margin-bottom: 15px;
      }

      .verida-modal-body-title {
        width: 50%;
        height: max-content;
        flex-direction: column;
      }

      .verida-modal-header {
        margin: 0 0.4rem 0 0.4rem;
      }

      .verida-modal-container {
        margin: 0;
        border-radius: 0;
      }

      .verida-body-content {
        text-align: center;
        margin-bottom: 30px;
      }

      .mobile-content {
        text-align: center;
      }

      .verida-modal-close {
        margin: 1rem 0 0 0;
      }
    }

    body.mobile .desktop-content {
      display: none;
    }

    body.desktop .mobile-content {
      display: none;
    }
    </style>
  `

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal: HTMLElement | null = document.getElementById('verida-modal');
  const closeModal: HTMLElement | null = document.getElementById('verida-modal-close');

  const authContext = store.get(`${VERIDA_AUTH_CONTEXT}/${contextName}`)

  const body = document.body;
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    // true for mobile device
    body.classList.add("mobile");
  } else {
    body.classList.add("desktop");
  }

  if (modal && closeModal) {
    closeModal.onclick = () => modal.style.display = 'none';
  }

  window.onclick = function (event: Event) {
    if (event.target === modal && modal !== null) {
      modal.style.display = 'none';
    }
  }

  new AuthClient(authConfig, modal)

  if (authContext && modal) {
    modal.style.display = 'none'
  } else {
    modal && (modal.style.display = "block");
  }

};
