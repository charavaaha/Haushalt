# Alltagsheld aufs iPhone bringen

Die App ist eine Web-App. Du lädst sie einmal ins Internet hoch und legst sie dann vom iPhone aus auf den Home-Bildschirm. Danach startet sie wie eine normale App: im Vollbild, mit eigenem Symbol, und auch offline. Alle Daten bleiben auf deinem iPhone.

## 1. Hochladen mit GitHub Pages (kostenlos, einmalig ca. 10 Minuten)

Am besten machst du das am Computer.

1. Lege auf github.com ein kostenloses Konto an.
2. Klick oben rechts auf **+** und dann auf **New repository**. Gib als Name `haushalt` ein, wähle **Public** und klick auf **Create repository**. Mit einem kostenlosen Konto muss das Projekt öffentlich sein, sonst lässt sich GitHub Pages nicht einschalten. Öffentlich ist dabei nur der Programmcode der App. Deine Einkaufslisten, Vorräte und To-dos liegen nur auf deinem iPhone und landen nie bei GitHub.
3. Nach dem Anlegen siehst du eine Seite mit der Überschrift **„Quick setup“**. Etwas darunter steht der Satz „Get started by creating a new file or **uploading an existing file**“. Klick dort auf den blauen Link **uploading an existing file**.
   - Siehst du diese Seite nicht, weil z. B. schon eine README-Datei angelegt wurde, klick oben rechts in der Dateiliste auf **Add file** und dann auf **Upload files**.
   - Entpacke vorher die ZIP-Datei mit einem Doppelklick.
   - Zieh alle Dateien aus dem entpackten Ordner in das Fenster (nur die Dateien, nicht den Ordner selbst). Du kannst auch auf **choose your files** klicken, die Dateien auswählen (am Mac alle mit Cmd+A, unter Windows mit Strg+A) und dann auf **Öffnen** klicken.
   - Warte, bis alle 12 Dateien in der Liste stehen, und klick unten auf den grünen Knopf **Commit changes**.
4. Geh zu **Settings**, dann **Pages**. Stell unter „Branch“ `main` und `/ (root)` ein und klick auf **Save**.
5. Warte 1–5 Minuten und lade dann dieselbe Seite neu (**Settings**, dann **Pages**). Ganz oben, direkt unter der Überschrift „GitHub Pages“, erscheint ein Kasten mit „Your site is live at …“ und einem Knopf **Visit site**. Dort steht deine Adresse, z. B. `https://DEINNAME.github.io/haushalt/`.

Es gibt eine Alternative ohne GitHub: Auf app.netlify.com/drop ziehst du den Ordner ins Fenster. Damit die Seite nicht nach einer Stunde gelöscht wird, brauchst du ein kostenloses Konto.

## 2. Auf dem iPhone installieren

1. Öffne die Adresse in **Safari**. Andere Browser funktionieren dafür nicht. Safari ist auf jedem iPhone vorinstalliert. Findest du es nicht, wisch auf dem Home-Bildschirm nach unten und such nach „Safari“. Wurde es gelöscht, kannst du es kostenlos im App Store wieder laden.
2. Tipp unten auf das **Teilen-Symbol** (Quadrat mit Pfeil) und dann auf **Zum Home-Bildschirm** und **Hinzufügen**.
3. Starte die App ab jetzt immer über das neue Symbol „Alltagsheld“.
4. Beim ersten Scannen fragt das iPhone, ob die App die Kamera benutzen darf. Tipp auf **Erlauben**. Beim ersten Mikrofon-Tippen fragt es nach dem Mikrofon.
5. Unter **Mehr**, dann **Mitteilungen erlauben**, schaltest du Erinnerungen ein, die erscheinen, solange die App läuft.

## Was offline geht

Einkaufsliste, Vorrat, To-dos, Rezeptvorschläge (55 eingebaute Rezepte, davon 26 vegan) und das Verstehen von Sprachbefehlen laufen alle ohne Internet. Auch der Barcode-Scanner funktioniert offline, und Produkte, die du schon einmal gescannt hast, erkennt er ohne Internet wieder.

## Was Internet braucht

- **Produktdaten zu einem neuen Barcode.** Name, Marke, Nährwerte, Allergene und Zutaten kommen kostenlos von Open Food Facts. Bist du offline, trägst du den Namen von Hand ein und tippst später auf „Infos online nachladen“.
- **Die Spracherkennung von Safari** braucht je nach iOS-Version Internet. Offline geht immer die **Diktiertaste der Tastatur** im Textfeld.
- **Der KI-Zusatz** (optional, siehe unten).

## Erinnerungen, auch wenn die App geschlossen ist

Eine Web-App kann sich auf dem iPhone nicht selbst melden, wenn sie geschlossen ist. Darum gibt es bei jedem To-do den Knopf **„In Kalender“**. Er trägt den Termin samt Erinnerung in deinen iPhone-Kalender ein, und das iPhone erinnert dich dann zuverlässig. Wenn dein Google-Konto auf dem iPhone eingerichtet ist (Einstellungen, dann Kalender, dann Accounts), kannst du beim Hinzufügen auch den Google-Kalender wählen.

## Sprachbefehle (Beispiele)

- „Milch, Eier und 500 g Mehl auf die Einkaufsliste“
- „Ich habe Milch und Brot gekauft“ (wird auf der Liste abgehakt und in den Vorrat übernommen)
- „Die Nudeln sind leer“ / „Kein Kaffee mehr“ (wird aus dem Vorrat genommen und auf die Einkaufsliste gesetzt)
- „Joghurt und Käse in den Kühlschrank“
- „Morgen um 9 Zahnarzt anrufen“ / „Erinnere mich Freitag 18 Uhr Mama anzurufen“
- „Nächsten Montag halb 8 Auto in die Werkstatt, eine Stunde vorher erinnern“
- „Zahnarzt anrufen ist erledigt“
- „Was kann ich heute kochen, vegetarisch und schnell?“ / „Vegane Rezepte mit Reis“

Mehrere Befehle in einem Satz gehen auch: „Milch auf die Liste und morgen um 9 Arzt anrufen“.

## Was die App von dir lernt

Die App lernt auf deinem iPhone, sobald du sie benutzt. Die Daten verlassen das Gerät nicht.

- **Kaufrhythmus:** Wenn du etwas regelmäßig kaufst, erkennt die App das. Ist es wieder fällig, schlägt die „Heute“-Karte oben auf der Einkaufsliste vor, es auf die Liste zu setzen. Ein Tipp auf **×** blendet den Vorschlag bis zum nächsten Kauf aus.
- **Reihenfolge im Laden:** Die App merkt sich, in welcher Reihenfolge du im Laden abhakst, und sortiert deine Liste beim nächsten Mal genauso.
- **Korrekturen:** Ein Tipp auf einen Artikelnamen öffnet die Bearbeitung. Wenn du z. B. „Brot“ in „Vollkornbrot“ änderst, macht die App das künftig automatisch.
- **Geschmack:** Unter jedem Rezept gibt es „👍 Gekocht“ und „👎 Nicht mein Fall“. Lieblingsrezepte schlägt die App öfter vor, abgelehnte seltener. Sie erkennt mit der Zeit auch, ob du lieber vegan, vegetarisch oder schnell kochst. Nach „Gekocht“ fragt sie, ob sie die Zutaten aus dem Vorrat abziehen soll.
- **Rückfragen:** Fehlt einer Aufgabe der Termin, fragt die App nach („Heute 18 Uhr / Morgen 9 Uhr …“). Bei Kühlschrank-Produkten fragt sie nach der Haltbarkeit, bei Terminen, ob sie sie in den iPhone-Kalender eintragen soll.
- **Antworten vorlesen:** Unter **Mehr** kannst du einschalten, dass die App ihre Antworten laut vorliest.

Wichtig: Wenn die App geschlossen ist, kann sie auf dem iPhone weder lernen noch dir etwas anzeigen. Sie wertet alles beim nächsten Öffnen aus. Erinnerungen bei geschlossener App kommen deshalb über den Kalender.

## Optional: KI-Zusatz

Mit einem eigenen Claude-API-Schlüssel (console.anthropic.com, Abrechnung nach Verbrauch) kann die App mehr:
- Sie versteht auch frei formulierte Sätze.
- Sie liest Produkte, die nicht in der Datenbank sind, vom Foto der Verpackung ab, inklusive Mindesthaltbarkeitsdatum.
- Sie schlägt neue Rezepte vor.

Den Schlüssel trägst du unter **Mehr** ein, dann **KI-Zusatz**. Ohne Schlüssel funktioniert alles andere genauso.

**Warum das etwas kostet:** Die KI läuft nicht auf deinem iPhone, sondern auf den Rechnern von Anthropic. Jede Anfrage braucht dort Rechenleistung, und die wird nach Menge abgerechnet. Ein normales Claude-Abo (z. B. Pro) deckt das nicht ab, die Programmierschnittstelle (API) wird getrennt bezahlt.

**Wie viel ungefähr:** Mit dem voreingestellten, günstigen Modell kostet ein Sprachbefehl etwa 0,01 Cent, ein Verpackungsfoto etwa 0,03 Cent und vier neue Rezepte etwa 0,1 Cent. Auch bei täglicher Nutzung bleibt das meist unter 1 € im Monat. Du lädst vorher Guthaben auf und kannst nie mehr ausgeben als aufgeladen ist.

## Auf Android installieren

1. Öffne die Adresse in **Chrome**.
2. Tipp oben rechts auf die **drei Punkte** und dann auf **App installieren** oder **Zum Startbildschirm hinzufügen**.
3. Für Termine nimmst du bei den To-dos am besten den Knopf **Google**. Er öffnet den Termin direkt in Google Kalender.

## Andere Personen nutzen die App

Jeder, der die Adresse kennt, kann die App auf seinem eigenen Handy installieren. Jedes Handy speichert seine eigenen Daten, du siehst also nichts von den anderen und sie nichts von dir. Wer den KI-Zusatz will, trägt auf seinem Handy einen eigenen Schlüssel ein und zahlt selbst. Für dich entstehen keine Kosten, solange du deinen Schlüssel nicht weitergibst oder auf fremden Handys einträgst.

## Daten sichern

Unter **Mehr**, dann **Sicherung speichern**, sicherst du deine Daten, z. B. in iCloud Drive. Mit „Sicherung laden“ holst du sie zurück, auch auf ein neues iPhone.

## Probleme?

**Die Adresse steht nicht bei „Pages“:**
- Auf der Startseite deines Projekts siehst du rechts (am Handy weiter unten) den Bereich **Deployments** mit dem Eintrag **github-pages**. Tipp darauf, dort steht die Adresse.
- Unter dem Reiter **Actions** siehst du, ob die Seite noch gebaut wird (gelber Punkt) oder fertig ist (grüner Haken).
- Die Adresse ist immer `https://DEINNAME.github.io/haushalt/`, mit deinem GitHub-Benutzernamen in Kleinbuchstaben.

**„404 – File not found“ beim Öffnen der Adresse:**
- **Kurz warten.** Nach dem Speichern in „Settings“ und „Pages“ dauert es 1–5 Minuten, bis die Seite online ist. Lade sie danach neu.
- **Prüfe, ob GitHub Pages eingeschaltet ist.** Unter „Settings“ und „Pages“ muss „Branch: main“ und „/ (root)“ ausgewählt und gespeichert sein. Ist alles fertig, steht oben „Your site is live at …“.
- **Prüfe, ob die Dateien direkt im Projekt liegen.** Auf der Startseite deines Projekts muss `index.html` direkt in der Liste stehen. Siehst du dort nur einen Ordner wie `haushalt-app`, wurde der Ordner statt der Dateien hochgeladen. Dann lösch das Projekt und lade nur die Dateien hoch.
- **Prüfe die Adresse.** Sie muss genau `https://DEINNAME.github.io/haushalt/` lauten. DEINNAME ist dein GitHub-Benutzername in Kleinbuchstaben, `haushalt` ist der Name des Projekts, und am Ende steht ein Schrägstrich.
