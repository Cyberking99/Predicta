/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-c5a460e4'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/add-BfmJ4YhQ.js",
    "revision": null
  }, {
    "url": "assets/all-wallets-Bhb0WsQW.js",
    "revision": null
  }, {
    "url": "assets/AllBets-VZQsgjfq.js",
    "revision": null
  }, {
    "url": "assets/apechain-SX5YFU6N-q5qBv-mp.js",
    "revision": null
  }, {
    "url": "assets/app-store-Cur3ahD0.js",
    "revision": null
  }, {
    "url": "assets/apple-DWOTDm8Z.js",
    "revision": null
  }, {
    "url": "assets/ar_AR-CTNWGWSS-DlAFo0vZ.js",
    "revision": null
  }, {
    "url": "assets/arbitrum-WURIBY6W-CqVkHBr5.js",
    "revision": null
  }, {
    "url": "assets/Arc-VDBY7LNS-BChRXCXW.js",
    "revision": null
  }, {
    "url": "assets/arrow-bottom-circle-CbELYw06.js",
    "revision": null
  }, {
    "url": "assets/arrow-bottom-DQTidzWX.js",
    "revision": null
  }, {
    "url": "assets/arrow-left-D3_uAzLF.js",
    "revision": null
  }, {
    "url": "assets/arrow-right-B2PnP3jk.js",
    "revision": null
  }, {
    "url": "assets/arrow-top-kdQZGbpI.js",
    "revision": null
  }, {
    "url": "assets/arweave-CAGvOb64.js",
    "revision": null
  }, {
    "url": "assets/assets-Q6ZU7ZJ5-P8HioiAD.js",
    "revision": null
  }, {
    "url": "assets/avalanche-KOMJD3XY-Dsn_JPR4.js",
    "revision": null
  }, {
    "url": "assets/bank-BDCAnEQr.js",
    "revision": null
  }, {
    "url": "assets/base-OAXLRA4F-CoYTVIiL.js",
    "revision": null
  }, {
    "url": "assets/basic-B-L83Lpn.js",
    "revision": null
  }, {
    "url": "assets/berachain-NJECWIVC-DumxnFvf.js",
    "revision": null
  }, {
    "url": "assets/biconomy-CTJDsyAy.js",
    "revision": null
  }, {
    "url": "assets/blast-V555OVXZ-BbhJh1tj.js",
    "revision": null
  }, {
    "url": "assets/Brave-BRAKJXDS-mq-Xo37j.js",
    "revision": null
  }, {
    "url": "assets/Browser-76IHF3Y2-BMhRaC5Z.js",
    "revision": null
  }, {
    "url": "assets/browser-CPwc3Uud.js",
    "revision": null
  }, {
    "url": "assets/browser-DCh0BSt2.js",
    "revision": null
  }, {
    "url": "assets/bsc-N647EYR2-B2nLKXWV.js",
    "revision": null
  }, {
    "url": "assets/card-CsATzIsY.js",
    "revision": null
  }, {
    "url": "assets/ccip-E-ugiGnb.js",
    "revision": null
  }, {
    "url": "assets/celo-GEP4TUHG-CenIBYLU.js",
    "revision": null
  }, {
    "url": "assets/checkmark-bold-CFT_ye3V.js",
    "revision": null
  }, {
    "url": "assets/checkmark-DrYIPjbb.js",
    "revision": null
  }, {
    "url": "assets/chevron-bottom-siZOPojH.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-hZIej-w8.js",
    "revision": null
  }, {
    "url": "assets/chevron-right-BE0xBTFM.js",
    "revision": null
  }, {
    "url": "assets/chevron-top-DuaSqe7e.js",
    "revision": null
  }, {
    "url": "assets/Chrome-65Q5P54Y-DR9MQEVr.js",
    "revision": null
  }, {
    "url": "assets/chrome-store-zX--K241.js",
    "revision": null
  }, {
    "url": "assets/clock-AKjBCYwg.js",
    "revision": null
  }, {
    "url": "assets/close-BpCVrxTn.js",
    "revision": null
  }, {
    "url": "assets/coinbaseWallet-OKXU3TRC-DnGdeF1T.js",
    "revision": null
  }, {
    "url": "assets/coinPlaceholder-a3oj-uJ-.js",
    "revision": null
  }, {
    "url": "assets/compass-BDXpnSaz.js",
    "revision": null
  }, {
    "url": "assets/connect-UA7M4XW6-IY3X6Bmr.js",
    "revision": null
  }, {
    "url": "assets/copy-BeFpbXwz.js",
    "revision": null
  }, {
    "url": "assets/core-BRpaZ4gv.js",
    "revision": null
  }, {
    "url": "assets/create-FASO7PVG-D_rvSpre.js",
    "revision": null
  }, {
    "url": "assets/cronos-HJPAQTAE-BEOvlOC4.js",
    "revision": null
  }, {
    "url": "assets/cursor-C2jvVKX8.js",
    "revision": null
  }, {
    "url": "assets/cursor-transparent-B-p5VUad.js",
    "revision": null
  }, {
    "url": "assets/de_DE-P43L3PR7-pJRS3eyz.js",
    "revision": null
  }, {
    "url": "assets/decimals-CXPoFdP8.js",
    "revision": null
  }, {
    "url": "assets/degen-FQQ4XGHB-CeHTs88l.js",
    "revision": null
  }, {
    "url": "assets/desktop-BE_2nstR.js",
    "revision": null
  }, {
    "url": "assets/disconnect-6IqogemJ.js",
    "revision": null
  }, {
    "url": "assets/discord-Ckk1gpev.js",
    "revision": null
  }, {
    "url": "assets/Edge-XSPUTORV-DEoZslQE.js",
    "revision": null
  }, {
    "url": "assets/engine-CQoJa9Xn.js",
    "revision": null
  }, {
    "url": "assets/es_419-JBX5FS3Q-Bk-MlIq_.js",
    "revision": null
  }, {
    "url": "assets/eth_estimateGas-EEB9H-qN.js",
    "revision": null
  }, {
    "url": "assets/eth_getTransactionCount-ClsV7V96.js",
    "revision": null
  }, {
    "url": "assets/ethereum-RGGVA4PY-SWGOlkuk.js",
    "revision": null
  }, {
    "url": "assets/etherscan-BYj1Pzqv.js",
    "revision": null
  }, {
    "url": "assets/events-SrYOEeHh.js",
    "revision": null
  }, {
    "url": "assets/exclamation-triangle-COYmz2yC.js",
    "revision": null
  }, {
    "url": "assets/extension-DqZPjNPd.js",
    "revision": null
  }, {
    "url": "assets/external-link-BiFC03h7.js",
    "revision": null
  }, {
    "url": "assets/extractIPFS-UFwM8M5r.js",
    "revision": null
  }, {
    "url": "assets/facebook-vWkwtKyT.js",
    "revision": null
  }, {
    "url": "assets/farcaster-B-ItrsQ_.js",
    "revision": null
  }, {
    "url": "assets/filters-B42oa3Jb.js",
    "revision": null
  }, {
    "url": "assets/Firefox-AAHGJQIP-Bp_Hm04m.js",
    "revision": null
  }, {
    "url": "assets/flow-5FQJFCTK-CUie2reO.js",
    "revision": null
  }, {
    "url": "assets/fr_FR-CM2EDAQC-DvlCXiU9.js",
    "revision": null
  }, {
    "url": "assets/getInstalledModules-D218s-Em.js",
    "revision": null
  }, {
    "url": "assets/github-C_yec1ug.js",
    "revision": null
  }, {
    "url": "assets/gnosis-37ZC4RBL-B137OtHZ.js",
    "revision": null
  }, {
    "url": "assets/google-pSwuM-Go.js",
    "revision": null
  }, {
    "url": "assets/gravity-J5YQHTYH-Bj6B0uod.js",
    "revision": null
  }, {
    "url": "assets/hardhat-TX56IT5N-CV1FY-wE.js",
    "revision": null
  }, {
    "url": "assets/help-circle-CaKGpi_f.js",
    "revision": null
  }, {
    "url": "assets/hi_IN-GYVCUYRD-CQnOa8U_.js",
    "revision": null
  }, {
    "url": "assets/hooks.module-DVteCePP.js",
    "revision": null
  }, {
    "url": "assets/hyperevm-VKPAA4SA-CHwraEsx.js",
    "revision": null
  }, {
    "url": "assets/id_ID-7ZWSMOOE-ZzIoBaiI.js",
    "revision": null
  }, {
    "url": "assets/id-DstKMmZl.js",
    "revision": null
  }, {
    "url": "assets/image-HnQkwCJi.js",
    "revision": null
  }, {
    "url": "assets/index-C_W3eSay.css",
    "revision": null
  }, {
    "url": "assets/index-CzYOAarU.js",
    "revision": null
  }, {
    "url": "assets/index-DhIg6f32.js",
    "revision": null
  }, {
    "url": "assets/index-DsLDI1Jb.js",
    "revision": null
  }, {
    "url": "assets/index-Dw_eYfuL.js",
    "revision": null
  }, {
    "url": "assets/index-DZw5j2EB.js",
    "revision": null
  }, {
    "url": "assets/index-e-lRfTYT.js",
    "revision": null
  }, {
    "url": "assets/index-FD_H5gHS.js",
    "revision": null
  }, {
    "url": "assets/index.es-Bdql9xzc.js",
    "revision": null
  }, {
    "url": "assets/info-circle-DC5De_N9.js",
    "revision": null
  }, {
    "url": "assets/info-xLRnQuK0.js",
    "revision": null
  }, {
    "url": "assets/ink-FZMYZWHG-62p-5IK5.js",
    "revision": null
  }, {
    "url": "assets/ja_JP-CGMP6VLZ-BBxPp4Hq.js",
    "revision": null
  }, {
    "url": "assets/kaia-65D2U3PU-JmuLQ4gC.js",
    "revision": null
  }, {
    "url": "assets/ko_KR-YCZDTF7X-4W342j3x.js",
    "revision": null
  }, {
    "url": "assets/lightbulb-i_2GtKr6.js",
    "revision": null
  }, {
    "url": "assets/linea-QRMVQ5DY-DuI3vv0d.js",
    "revision": null
  }, {
    "url": "assets/Linux-OO4TNCLJ-B0aw93n9.js",
    "revision": null
  }, {
    "url": "assets/login-UP3DZBGS-Db_wM5oQ.js",
    "revision": null
  }, {
    "url": "assets/Macos-MW4AE7LN-Vvm8Drw3.js",
    "revision": null
  }, {
    "url": "assets/mail-CtsfoOUl.js",
    "revision": null
  }, {
    "url": "assets/manta-SI27YFEJ-CpVOKa06.js",
    "revision": null
  }, {
    "url": "assets/mantle-CKIUT334-DR2WgqzU.js",
    "revision": null
  }, {
    "url": "assets/metamask-sdk-Dg0k_Dr2.js",
    "revision": null
  }, {
    "url": "assets/metaMaskWallet-SITXT2FV-BlemcphV.js",
    "revision": null
  }, {
    "url": "assets/mobile-j15FVllz.js",
    "revision": null
  }, {
    "url": "assets/more-DQbyxJTb.js",
    "revision": null
  }, {
    "url": "assets/ms_MY-5LHAYMS7-BUU8UB2I.js",
    "revision": null
  }, {
    "url": "assets/network-placeholder-CixYYgjK.js",
    "revision": null
  }, {
    "url": "assets/nftPlaceholder-vAR_O8g4.js",
    "revision": null
  }, {
    "url": "assets/off-zEdf3x2E.js",
    "revision": null
  }, {
    "url": "assets/openzeppelin-BwI3zwCW.js",
    "revision": null
  }, {
    "url": "assets/Opera-KQZLSACL-Cwv5MDFy.js",
    "revision": null
  }, {
    "url": "assets/optimism-HAF2GUT7-ec6Nqxs9.js",
    "revision": null
  }, {
    "url": "assets/play-store-B7rO0haO.js",
    "revision": null
  }, {
    "url": "assets/plus-D8tw_EV9.js",
    "revision": null
  }, {
    "url": "assets/polygon-WW6ZI7PM-DXlmm4L1.js",
    "revision": null
  }, {
    "url": "assets/Prediction-jLDxEpHA.js",
    "revision": null
  }, {
    "url": "assets/pt_BR-3JTS4PSK-Cou37HE0.js",
    "revision": null
  }, {
    "url": "assets/qr-code-BrLSjI1C.js",
    "revision": null
  }, {
    "url": "assets/rainbowWallet-O26YNBMX-DUhYus-9.js",
    "revision": null
  }, {
    "url": "assets/recycle-horizontal-DYEQkZgU.js",
    "revision": null
  }, {
    "url": "assets/refresh-0SJMcBAf.js",
    "revision": null
  }, {
    "url": "assets/refresh-S4T5V5GX-CwqIaaxK.js",
    "revision": null
  }, {
    "url": "assets/reown-logo-Djytmblc.js",
    "revision": null
  }, {
    "url": "assets/resolveImplementation-BuDPl09N.js",
    "revision": null
  }, {
    "url": "assets/ronin-EMCPYXZT-N-QBHZdV.js",
    "revision": null
  }, {
    "url": "assets/ru_RU-6J6XERHI-BEDPqa1p.js",
    "revision": null
  }, {
    "url": "assets/Safari-ZPL37GXR-C4Ggg6rz.js",
    "revision": null
  }, {
    "url": "assets/safeWallet-5MNKTR5Z-D-5imDLD.js",
    "revision": null
  }, {
    "url": "assets/sanko-RHQYXGM5-OX010CbN.js",
    "revision": null
  }, {
    "url": "assets/scan-4UYSQ56Q-CjMz6-XC.js",
    "revision": null
  }, {
    "url": "assets/scroll-5OBGQVOV-DJFECiai.js",
    "revision": null
  }, {
    "url": "assets/search-D3DMNbo0.js",
    "revision": null
  }, {
    "url": "assets/secp256k1-B1GC9vXp.js",
    "revision": null
  }, {
    "url": "assets/secp256k1-Dx2McE2N.js",
    "revision": null
  }, {
    "url": "assets/send-CfEj-rkY.js",
    "revision": null
  }, {
    "url": "assets/send-gasless-transaction-Bo1MTzU8.js",
    "revision": null
  }, {
    "url": "assets/sign-A7IJEUT5-CGsRnPrd.js",
    "revision": null
  }, {
    "url": "assets/signing-CXrOYJh5.js",
    "revision": null
  }, {
    "url": "assets/superposition-HG6MMR2Y-bRkgatRO.js",
    "revision": null
  }, {
    "url": "assets/swapHorizontal-cFle0iAj.js",
    "revision": null
  }, {
    "url": "assets/swapHorizontalBold-3pJLHYNG.js",
    "revision": null
  }, {
    "url": "assets/swapHorizontalMedium-RcHQQOEr.js",
    "revision": null
  }, {
    "url": "assets/swapHorizontalRoundedBold-DP6nDAQ1.js",
    "revision": null
  }, {
    "url": "assets/swapVertical-C2fj-4Ml.js",
    "revision": null
  }, {
    "url": "assets/telegram-DW8wq1yo.js",
    "revision": null
  }, {
    "url": "assets/th_TH-STXOD4CR-DmwaGyKS.js",
    "revision": null
  }, {
    "url": "assets/three-dots-BT_wxAZu.js",
    "revision": null
  }, {
    "url": "assets/tr_TR-P7QAUUZU-DHzPxq5a.js",
    "revision": null
  }, {
    "url": "assets/twitch-zMfJbF3p.js",
    "revision": null
  }, {
    "url": "assets/twitterIcon-BTTil1L3.js",
    "revision": null
  }, {
    "url": "assets/uk_UA-JTTBGJGQ-bEPIKyyu.js",
    "revision": null
  }, {
    "url": "assets/unichain-C5BWO2ZY-BfguYsnu.js",
    "revision": null
  }, {
    "url": "assets/verify-DlJR4Jop.js",
    "revision": null
  }, {
    "url": "assets/verify-filled-CqkOrHQi.js",
    "revision": null
  }, {
    "url": "assets/vi_VN-5XUUAVWW-DvcbUvCZ.js",
    "revision": null
  }, {
    "url": "assets/w3m-modal-DkDwUQ_R.js",
    "revision": null
  }, {
    "url": "assets/wallet-DFbmfiAn.js",
    "revision": null
  }, {
    "url": "assets/wallet-placeholder-BbTEYr_F.js",
    "revision": null
  }, {
    "url": "assets/walletconnect-XIUAINA3.js",
    "revision": null
  }, {
    "url": "assets/walletConnectWallet-YHWKVTDY-D3lyiczV.js",
    "revision": null
  }, {
    "url": "assets/warning-circle-_UZyu2zB.js",
    "revision": null
  }, {
    "url": "assets/Windows-PPTHQER6-BlyV2p7Y.js",
    "revision": null
  }, {
    "url": "assets/workbox-window.prod.es5-B9K5rw8f.js",
    "revision": null
  }, {
    "url": "assets/x-DIjXb1yt.js",
    "revision": null
  }, {
    "url": "assets/xdc-KJ3TDBYO-DNV6zchh.js",
    "revision": null
  }, {
    "url": "assets/zetachain-TLDS5IPW-Udhyw16T.js",
    "revision": null
  }, {
    "url": "assets/zh_CN-RGMLPFEP-CPkk4IYh.js",
    "revision": null
  }, {
    "url": "assets/zh_HK-YM3T6EI5-BYHcXtXC.js",
    "revision": null
  }, {
    "url": "assets/zh_TW-HAEH6VE5-r-nym7hs.js",
    "revision": null
  }, {
    "url": "assets/zksync-DH7HK5U4-Dt4usFw6.js",
    "revision": null
  }, {
    "url": "assets/zora-FYL5H3IO-iB4wygST.js",
    "revision": null
  }, {
    "url": "index.html",
    "revision": "eef9ac7475a66b3caabd6ed1f1714434"
  }, {
    "url": "index.html",
    "revision": "0.9liuaib2vl"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    allowlist: [/^\/$/]
  }));
  workbox.registerRoute(({
    request
  }) => request.destination === "image" || request.destination === "script" || request.destination === "style", new workbox.CacheFirst({
    "cacheName": "assets-cache",
    plugins: []
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => request.destination === "document", new workbox.NetworkFirst({
    "cacheName": "html-cache",
    plugins: []
  }), 'GET');

}));
