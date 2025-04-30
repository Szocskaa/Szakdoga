# 3D Print Monitor

Webalkalmazás 3D nyomatok monitorozására és elemzésére, AI-alapú hibadetektálással és -elemzéssel.

## Funkciók

- **3D Nyomtatási Hiba Detektálás**: Roboflow használata nyomtatási hibák képekről történő felismerésére
- **AI-alapú Hiba Elemzés**: Gemini AI használata a felismert hibák elemzésére és javaslatok nyújtására
- **Chat Felület**: Interakció az AI asszisztenssel a felismert nyomtatási hibákkal kapcsolatos kérdések feltevéséhez
- **Képfeltöltés**: 3D nyomatokról készült képek feltöltése elemzésre közvetlenül a chat felületen keresztül

## Előfeltételek

- Node.js (v18 vagy újabb ajánlott)
- npm (a Node.js-sel együtt települ)

## Telepítés

1. Klónozza a repositoryt
2. Telepítse a függőségeket:
```bash
npm install
```
3. Hozzon létre egy `.env` fájlt a következő változókkal:
```
ROBOFLOW_API_KEY=sajat_roboflow_api_kulcs
PROJECT_ID=sajat_roboflow_projekt_id
MODEL_VERSION=sajat_modell_verzio
GEMINI_API_KEY=sajat_gemini_api_kulcs
```
4. Buildelje az alkalmazást:
```bash
npx tsc
```
5. Indítsa el a szervert:
```bash
npm start
```

## Az AI Nyomtatási Hiba Elemzés Használata

1. Használja a "Nyomat kép feltöltése elemzésre" gombot a chat felületen
2. A Gemini AI elemzi a képet, és megállapítja, hogy mutat-e nyomtatási hibát
3. Ha hibát észlel, az AI:
   - Leírja a hiba típusát
   - Elemzi a lehetséges okokat
   - Konkrét javítási javaslatokat tesz
   - Értékeli a súlyosságot 1-től 10-ig terjedő skálán
4. További kérdéseket tehet fel a hibával kapcsolatban a chatben

## Felhasznált Technológiák

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express, TypeScript
- **AI Szolgáltatások**:
  - Roboflow (Objektumdetektálás)
  - Google Gemini AI (Képelemzés és Chat)

## Fejlesztés

A fejlesztői szerver futtatása hot-reloadinggal:
```bash
npm run dev
``` 