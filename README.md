# Crossban Bot

Ein Twitch-Bot zum Verwalten von Crossbans über mehrere Channels.

## Installation & Nutzung

1. Repository herunterladen und entpacken.

2. Öffne den Datei-Explorer und navigiere zum Ordner, in den du den Bot entpackt hast.

3. Klicke in die Adressleiste des Explorers und tippe `cmd` ein, dann drücke Enter.  
   Dadurch öffnet sich eine Eingabeaufforderung direkt im richtigen Verzeichnis.

   **Oder:**  
   Öffne die Eingabeaufforderung (CMD) manuell und gib den Pfad zu deinem Bot-Ordner ein, z.B.:  
*(Ersetze den Pfad durch deinen tatsächlichen Speicherort – bei mir war es z.B.:*  
`cd "C:\Users\Shadow\Desktop\crossban-bot\crossban-bot\crossban-bot-reworked"` *)

4. Installiere die Abhängigkeiten mit: npm i oder mpm install (Ist egal )
5. 
5. Passe die Konfigurationsdateien an:  
- Benenne `example.env` um in `.env`  
- Benenne `example.config.json` um in `config.json`  
- Öffne `.env` und trage folgende Werte ein:
  - `TWITCH_USERNAME`: Dein Twitch-Benutzername  
  - `USER_ID`: Deine Twitch-ID  
  - `OAUTH_TOKEN`: Dein OAuth-Token (erstellen unter [twitchtokengenerator.com](https://twitchtokengenerator.com/) – am besten alle Scopes anhaken, Token generieren und Access Token kopieren)  
  - `CLIENT_ID`: Deine Twitch Client-ID

6. Starte den Bot mit:  
node index.js 
