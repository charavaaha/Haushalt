# Haushalt-App aufs iPhone bringen

Die App ist eine Web-App. Du lädst sie einmal ins Internet hoch und legst sie dann vom iPhone aus auf den Home-Bildschirm. Danach startet sie wie eine normale App: im Vollbild, mit eigenem Symbol, und auch offline. Alle Daten bleiben auf deinem iPhone.

## 1. Hochladen mit GitHub Pages (kostenlos, einmalig ca. 10 Minuten)

Am besten machst du das am Computer.

1. Lege auf github.com ein kostenloses Konto an.
2. Klick oben rechts auf **+** und dann auf **New repository**. Gib als Name `haushalt` ein, wähle **Public** und klick auf **Create repository**. Mit einem kostenlosen Konto muss das Projekt öffentlich sein, sonst lässt sich GitHub Pages nicht einschalten. Öffentlich ist dabei nur der Programmcode der App. Deine Einkaufslisten, Vorräte und To-dos liegen nur auf deinem iPhone und landen nie bei GitHub.
3. Klick auf **uploading an existing file**. Zieh alle Dateien aus dem entpackten ZIP-Ordner in das Fenster (nur die Dateien, nicht den Ordner selbst). Klick dann auf **Commit changes**.
4. Geh zu **Settings**, dann **Pages**. Stell unter „Branch“ `main` und `/ (root)` ein und klick auf **Save**.
5. Nach etwa 1 Minute steht oben die Adresse, z. B. `https://DEINNAME.github.io/haushalt/`.

Es gibt eine Alternative ohne GitHub: Auf app.netlify.com/drop ziehst du den Ordner ins Fenster. Damit die Seite nicht nach einer Stunde gelöscht wird, brauchst du ein kostenloses Konto.

## 2. Auf dem iPhone installieren

1. Öffne die Adresse in **Safari**. Andere Browser funktionieren dafür nicht.
2. Tipp unten auf das **Teilen-Symbol** (Quadrat mit Pfeil) und dann auf **Zum Home-Bildschirm** und **Hinzufügen**.
3. Starte die App ab jetzt immer über das neue Symbol „Haushalt“.
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

## Daten sichern

Unter **Mehr**, dann **Sicherung speichern**, sicherst du deine Daten, z. B. in iCloud Drive. Mit „Sicherung laden“ holst du sie zurück, auch auf ein neues iPhone.
