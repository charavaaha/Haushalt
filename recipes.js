/* Eingebaute Rezeptsammlung + Abgleich mit dem Vorrat – komplett offline. */
(function (root) {
  'use strict';
  // Zutaten: "Anzeigename|Alternative|Alternative". Salz, Pfeffer, Öl, Wasser und Zucker gelten als vorhanden.
  const R = [
    ['Spaghetti Aglio e Olio', 15, 2, ['Nudeln|Spaghetti|Pasta|Linguine', 'Knoblauch', 'Chili|Chiliflocken|Peperoni', 'Petersilie'], ['Nudeln in Salzwasser bissfest kochen.', 'Knoblauch in Scheiben mit Chili in reichlich Olivenöl sanft goldgelb braten.', 'Nudeln mit etwas Kochwasser in die Pfanne geben und schwenken.', 'Mit Petersilie, Salz und Pfeffer abschmecken.']],
    ['Spaghetti Bolognese', 40, 0, ['Nudeln|Spaghetti|Pasta', 'Hackfleisch|Hack|Rinderhack', 'Zwiebel', 'Tomaten|Passierte Tomaten|Dosentomaten|Tomatenmark', 'Karotte|Möhre|Karotten|Möhren'], ['Zwiebel und Karotte fein würfeln, mit dem Hack krümelig anbraten.', 'Tomaten dazugeben, salzen, pfeffern und 25 Minuten köcheln lassen.', 'Nudeln kochen und mit der Soße servieren.']],
    ['Pfannkuchen', 20, 1, ['Mehl', 'Milch', 'Eier|Ei', 'Butter'], ['250 g Mehl, 500 ml Milch, 3 Eier und eine Prise Salz glatt rühren, 10 Minuten quellen lassen.', 'Wenig Butter in der Pfanne erhitzen, dünn Teig einfüllen.', 'Von beiden Seiten goldbraun backen – süß oder herzhaft füllen.']],
    ['Rührei mit Brot', 10, 1, ['Eier|Ei', 'Butter', 'Brot|Toast|Brötchen', 'Schnittlauch|Kräuter'], ['Eier mit Salz und Pfeffer verquirlen.', 'In Butter bei mittlerer Hitze langsam stocken lassen, dabei schieben.', 'Mit Schnittlauch auf geröstetem Brot servieren.']],
    ['Gemüse-Omelett', 15, 1, ['Eier|Ei', 'Paprika', 'Zwiebel', 'Käse|Gouda|Emmentaler|Feta'], ['Paprika und Zwiebel würfeln und kurz anbraten.', 'Verquirlte, gewürzte Eier darübergießen.', 'Käse darüberstreuen, Deckel drauf und bei kleiner Hitze stocken lassen.']],
    ['Tomatensuppe', 25, 1, ['Tomaten|Passierte Tomaten|Dosentomaten', 'Zwiebel', 'Knoblauch', 'Sahne|Schmand|Crème fraîche|Creme fraiche', 'Brühe|Gemüsebrühe'], ['Zwiebel und Knoblauch in Öl andünsten.', 'Tomaten und 300 ml Brühe dazu, 15 Minuten köcheln.', 'Fein pürieren, Sahne einrühren, abschmecken.']],
    ['Kartoffelsuppe', 35, 2, ['Kartoffeln|Kartoffel', 'Karotte|Möhre|Karotten|Möhren', 'Lauch|Porree', 'Zwiebel', 'Brühe|Gemüsebrühe'], ['Gemüse schälen und würfeln, Zwiebel andünsten.', 'Restliches Gemüse dazu, mit 1 l Brühe auffüllen.', '20 Minuten kochen, teilweise pürieren, mit Muskat abschmecken.']],
    ['Bratkartoffeln mit Spiegelei', 30, 1, ['Kartoffeln|Kartoffel', 'Zwiebel', 'Eier|Ei'], ['Kartoffeln kochen (oder Reste vom Vortag nehmen), in Scheiben schneiden.', 'In Öl knusprig braten, Zwiebeln dazugeben.', 'Spiegeleier braten und dazu servieren.']],
    ['Gemüsepfanne mit Reis', 25, 2, ['Reis', 'Paprika', 'Zucchini', 'Karotte|Möhre|Karotten|Möhren', 'Sojasauce|Sojasoße'], ['Reis kochen.', 'Gemüse in Streifen schneiden und im Wok scharf anbraten.', 'Mit Sojasauce ablöschen und mit dem Reis servieren.']],
    ['Hähnchen-Curry', 30, 0, ['Hähnchen|Hühnchen|Hähnchenbrust|Hähnchenfilet', 'Kokosmilch', 'Currypaste|Curry|Currypulver', 'Reis', 'Paprika'], ['Reis kochen.', 'Hähnchen würfeln und anbraten, Currypaste kurz mitrösten.', 'Paprika und Kokosmilch dazu, 10 Minuten köcheln.', 'Mit Reis servieren.']],
    ['Chili con Carne', 40, 0, ['Hackfleisch|Hack|Rinderhack', 'Kidneybohnen|Bohnen', 'Mais', 'Tomaten|Passierte Tomaten|Dosentomaten', 'Zwiebel'], ['Zwiebel und Hack anbraten.', 'Tomaten, Bohnen und Mais dazu, mit Chili, Kreuzkümmel und Salz würzen.', '25 Minuten köcheln lassen.']],
    ['Chili sin Carne', 35, 2, ['Kidneybohnen|Bohnen', 'Mais', 'Tomaten|Passierte Tomaten|Dosentomaten', 'Paprika', 'Zwiebel'], ['Zwiebel und Paprika würfeln und anbraten.', 'Tomaten, Bohnen und Mais dazu, kräftig würzen.', '20 Minuten köcheln lassen, nach Wunsch mit Reis oder Brot.']],
    ['Ofengemüse mit Feta', 40, 1, ['Kartoffeln|Süßkartoffel|Kartoffel', 'Paprika', 'Zucchini', 'Feta|Schafskäse|Hirtenkäse', 'Zwiebel'], ['Ofen auf 200 °C vorheizen.', 'Gemüse grob schneiden, mit Öl, Salz und Kräutern mischen.', '30 Minuten backen, Feta zerbröseln und 5 Minuten mitbacken.']],
    ['Käsespätzle', 25, 1, ['Spätzle', 'Käse|Emmentaler|Bergkäse|Gouda', 'Zwiebel', 'Butter'], ['Zwiebeln in Ringen in Butter goldbraun braten.', 'Spätzle erhitzen, schichtweise mit geriebenem Käse in eine Pfanne geben.', 'Schmelzen lassen und mit den Röstzwiebeln servieren.']],
    ['Gnocchi Tomate-Mozzarella', 20, 1, ['Gnocchi', 'Tomaten|Cherrytomaten|Kirschtomaten', 'Mozzarella', 'Basilikum'], ['Gnocchi in Öl goldbraun braten.', 'Tomaten halbieren und kurz mitbraten.', 'Mozzarella zupfen, unterheben und mit Basilikum servieren.']],
    ['Lachs mit Ofenkartoffeln', 35, 0, ['Lachs|Lachsfilet', 'Kartoffeln|Kartoffel', 'Zitrone', 'Dill|Kräuter|Petersilie'], ['Kartoffeln vierteln, mit Öl und Salz 25 Minuten bei 200 °C backen.', 'Lachs würzen und die letzten 12 Minuten mit in den Ofen legen.', 'Mit Zitrone und Dill servieren.']],
    ['Linsen-Dal', 30, 2, ['Linsen|Rote Linsen', 'Kokosmilch', 'Zwiebel', 'Knoblauch', 'Ingwer', 'Tomaten|Dosentomaten|Passierte Tomaten'], ['Zwiebel, Knoblauch und Ingwer andünsten, Curry oder Kurkuma dazu.', 'Linsen, Tomaten, Kokosmilch und 300 ml Wasser zugeben.', '20 Minuten sämig kochen, salzen.']],
    ['Gebratener Reis', 20, 1, ['Reis', 'Eier|Ei', 'Erbsen', 'Karotte|Möhre|Karotten|Möhren', 'Frühlingszwiebel|Zwiebel', 'Sojasauce|Sojasoße'], ['Am besten Reis vom Vortag nehmen.', 'Gemüse im Wok anbraten, Eier dazu und stocken lassen.', 'Reis zugeben, scharf braten und mit Sojasauce würzen.']],
    ['Brokkoli-Nudelauflauf', 35, 1, ['Nudeln|Pasta|Penne|Fusilli', 'Brokkoli', 'Sahne|Milch', 'Käse|Gouda|Emmentaler|Mozzarella'], ['Nudeln und Brokkoli kurz vorkochen.', 'In eine Auflaufform geben, Sahne mit Salz, Pfeffer und Muskat darübergießen.', 'Mit Käse bestreuen, 20 Minuten bei 200 °C überbacken.']],
    ['Shakshuka', 25, 1, ['Eier|Ei', 'Tomaten|Dosentomaten|Passierte Tomaten', 'Paprika', 'Zwiebel', 'Knoblauch'], ['Zwiebel, Paprika und Knoblauch anbraten, mit Paprikapulver und Kreuzkümmel würzen.', 'Tomaten dazu, 10 Minuten einkochen.', 'Mulden formen, Eier hineinschlagen, zugedeckt stocken lassen.']],
    ['Hähnchen-Wraps', 20, 0, ['Wraps|Tortilla|Tortillas', 'Hähnchen|Hühnchen|Hähnchenbrust', 'Salat|Eisbergsalat', 'Tomaten', 'Joghurt|Schmand|Crème fraîche'], ['Hähnchen in Streifen braten und würzen.', 'Wraps kurz erwärmen.', 'Mit Joghurtsoße bestreichen, belegen und einrollen.']],
    ['Quesadillas', 15, 1, ['Wraps|Tortilla|Tortillas', 'Käse|Gouda|Cheddar|Mozzarella', 'Mais', 'Kidneybohnen|Bohnen', 'Paprika'], ['Eine Tortilla-Hälfte mit Käse, Mais, Bohnen und Paprika belegen.', 'Zuklappen und in der trockenen Pfanne von beiden Seiten knusprig braten.', 'In Stücke schneiden.']],
    ['Schnitzel mit Kartoffeln', 35, 0, ['Schnitzel|Schweinefleisch|Putenschnitzel', 'Eier|Ei', 'Paniermehl|Semmelbrösel', 'Mehl', 'Kartoffeln|Kartoffel'], ['Kartoffeln kochen.', 'Schnitzel dünn klopfen, würzen, in Mehl, Ei und Paniermehl wenden.', 'In reichlich Öl goldbraun ausbacken.']],
    ['Kartoffelsalat', 30, 2, ['Kartoffeln|Kartoffel', 'Gewürzgurken|Gurken|Essiggurken', 'Zwiebel', 'Brühe|Gemüsebrühe', 'Essig'], ['Kartoffeln kochen, pellen und in Scheiben schneiden.', 'Zwiebel in heißer Brühe mit Essig, Öl, Salz und Pfeffer aufkochen.', 'Über die warmen Kartoffeln gießen, Gurken dazu, 30 Minuten ziehen lassen.']],
    ['Griechischer Salat', 10, 1, ['Gurke|Salatgurke', 'Tomaten', 'Feta|Schafskäse|Hirtenkäse', 'Paprika', 'Oliven', 'Zwiebel'], ['Gemüse grob schneiden.', 'Oliven und Feta dazugeben.', 'Mit Olivenöl, Oregano, Salz und Pfeffer anmachen.']],
    ['Pilzrisotto', 35, 1, ['Risottoreis|Reis', 'Champignons|Pilze', 'Zwiebel', 'Parmesan|Hartkäse', 'Brühe|Gemüsebrühe'], ['Pilze anbraten und beiseitestellen.', 'Zwiebel andünsten, Reis glasig anschwitzen.', 'Nach und nach heiße Brühe angießen und rühren (ca. 20 Minuten).', 'Pilze und Parmesan unterrühren.']],
    ['Toast Hawaii', 15, 0, ['Toast|Toastbrot', 'Schinken|Kochschinken', 'Ananas', 'Käse|Gouda|Scheibenkäse'], ['Toast leicht buttern.', 'Mit Schinken, Ananas und Käse belegen.', '10 Minuten bei 200 °C überbacken.']],
    ['Milchreis', 35, 1, ['Milchreis|Reis', 'Milch', 'Zimt'], ['1 l Milch mit 250 g Milchreis, Zucker und einer Prise Salz aufkochen.', 'Bei kleinster Hitze 30 Minuten quellen lassen, ab und zu rühren.', 'Mit Zimt und Zucker oder Obst servieren.']],
    ['Porridge', 10, 1, ['Haferflocken', 'Milch|Haferdrink|Pflanzenmilch', 'Banane|Apfel|Beeren'], ['Haferflocken mit doppelter Menge Milch aufkochen.', '5 Minuten unter Rühren quellen lassen.', 'Mit Obst und etwas Honig servieren.']],
    ['Bananen-Pancakes', 15, 1, ['Banane|Bananen', 'Eier|Ei', 'Haferflocken'], ['1 Banane zerdrücken, mit 2 Eiern und 4 EL Haferflocken verrühren.', 'Kleine Pancakes in wenig Öl ausbacken.', 'Mit Obst oder Joghurt servieren.']],
    ['Würstchen mit Kartoffelpüree', 30, 0, ['Würstchen|Wiener|Bratwurst|Würste', 'Kartoffeln|Kartoffel', 'Milch', 'Butter'], ['Kartoffeln kochen und abgießen.', 'Mit warmer Milch, Butter, Salz und Muskat stampfen.', 'Würstchen erhitzen oder braten und dazu servieren.']],
    ['Tortellini in Sahnesoße', 15, 0, ['Tortellini', 'Sahne', 'Schinken|Kochschinken|Erbsen', 'Parmesan|Hartkäse'], ['Tortellini nach Packung kochen.', 'Schinken anbraten, mit Sahne ablöschen, kurz einkochen.', 'Tortellini unterheben, mit Parmesan servieren.']],
    ['Bruschetta', 15, 2, ['Baguette|Ciabatta|Brot', 'Tomaten', 'Knoblauch', 'Basilikum'], ['Tomaten würfeln, mit Basilikum, Öl, Salz und Pfeffer mischen.', 'Brot in Scheiben rösten, mit Knoblauch einreiben.', 'Tomatenmischung daraufgeben.']],
    ['Couscous-Salat', 20, 2, ['Couscous|Bulgur', 'Gurke|Salatgurke', 'Tomaten', 'Paprika', 'Petersilie|Minze', 'Zitrone'], ['Couscous mit kochendem Wasser übergießen, 5 Minuten quellen lassen.', 'Gemüse klein würfeln.', 'Alles mit Zitronensaft, Öl und Kräutern mischen.']],
    ['Hähnchen mit Reis und Brokkoli', 30, 0, ['Hähnchen|Hühnchen|Hähnchenbrust', 'Reis', 'Brokkoli', 'Sojasauce|Sojasoße'], ['Reis kochen, Brokkoli in Röschen kurz garen.', 'Hähnchen in Stücken scharf anbraten.', 'Brokkoli dazu, mit Sojasauce ablöschen, mit Reis servieren.']],
    ['Ofenkartoffel mit Kräuterquark', 50, 1, ['Kartoffeln|Kartoffel', 'Quark|Magerquark', 'Schnittlauch|Kräuter'], ['Große Kartoffeln in Alufolie 45 Minuten bei 200 °C backen.', 'Quark mit Milch, Salz und Kräutern glatt rühren.', 'Kartoffeln aufschneiden und füllen.']],
    ['Linsensuppe', 40, 2, ['Linsen|Tellerlinsen', 'Kartoffeln|Kartoffel', 'Karotte|Möhre|Karotten', 'Zwiebel', 'Brühe|Gemüsebrühe', 'Essig'], ['Zwiebel andünsten, Linsen und gewürfeltes Gemüse dazugeben.', 'Mit 1,2 l Brühe 30 Minuten köcheln.', 'Mit Essig, Salz und Pfeffer abschmecken.']],
    ['Thunfisch-Pasta', 20, 0, ['Nudeln|Pasta|Spaghetti|Penne', 'Thunfisch', 'Tomaten|Dosentomaten|Passierte Tomaten', 'Zwiebel', 'Kapern|Oliven'], ['Nudeln kochen.', 'Zwiebel anbraten, Tomaten dazu, 10 Minuten köcheln.', 'Thunfisch und Kapern unterheben, mit den Nudeln mischen.']],
    // ---- vegan ----
    ['Kichererbsen-Curry', 30, 2, ['Kichererbsen', 'Kokosmilch', 'Zwiebel', 'Spinat|Blattspinat', 'Currypaste|Curry|Currypulver', 'Reis'], ['Reis kochen.', 'Zwiebel mit Currypaste in Öl anbraten.', 'Kichererbsen und Kokosmilch dazu, 10 Minuten köcheln.', 'Spinat unterheben, bis er zusammenfällt, mit Salz und Limette abschmecken.']],
    ['Tofu-Gemüse-Pfanne', 25, 2, ['Tofu', 'Brokkoli|Paprika|Zucchini', 'Karotte|Möhre|Karotten', 'Sojasauce|Sojasoße', 'Reis|Nudeln|Mie-Nudeln'], ['Tofu trocken tupfen, würfeln und in Öl knusprig braten.', 'Gemüse dazugeben und bissfest braten.', 'Mit Sojasauce und etwas Ahornsirup glasieren, mit Reis servieren.']],
    ['Linsen-Bolognese', 35, 2, ['Rote Linsen|Linsen', 'Nudeln|Spaghetti|Pasta', 'Tomaten|Passierte Tomaten|Dosentomaten', 'Zwiebel', 'Karotte|Möhre|Karotten'], ['Zwiebel und Karotte fein würfeln und andünsten.', 'Linsen, Tomaten und 200 ml Wasser dazu, 20 Minuten köcheln.', 'Mit Oregano, Salz und Pfeffer würzen, zu den Nudeln servieren.']],
    ['Erdnuss-Nudeln', 20, 2, ['Nudeln|Mie-Nudeln|Spaghetti|Reisnudeln', 'Erdnussbutter|Erdnussmus', 'Sojasauce|Sojasoße', 'Knoblauch', 'Frühlingszwiebel|Gurke|Karotte'], ['Nudeln kochen.', 'Erdnussbutter mit Sojasauce, Knoblauch, Limette und etwas Nudelwasser glatt rühren.', 'Mit den Nudeln mischen, mit Frühlingszwiebeln und Gemüse toppen.']],
    ['Rührtofu', 15, 2, ['Tofu', 'Zwiebel|Frühlingszwiebel', 'Paprika|Tomaten|Spinat', 'Brot|Toast|Brötchen'], ['Tofu mit einer Gabel zerbröseln.', 'Zwiebel und Gemüse anbraten, Tofu dazu, mit Kurkuma, Salz und Pfeffer würzen.', 'Auf Brot servieren.']],
    ['Hummus-Teller mit Gemüse', 15, 2, ['Kichererbsen', 'Tahin|Sesammus', 'Zitrone', 'Knoblauch', 'Gurke|Karotte|Paprika', 'Fladenbrot|Brot'], ['Kichererbsen mit Tahin, Zitronensaft, Knoblauch, Salz und etwas Wasser cremig pürieren.', 'Gemüse in Sticks schneiden.', 'Hummus mit Olivenöl beträufeln und mit Gemüse und Brot servieren.']],
    ['Ofen-Süßkartoffel mit Kichererbsen', 40, 2, ['Süßkartoffel|Süßkartoffeln', 'Kichererbsen', 'Rote Zwiebel|Zwiebel', 'Spinat|Rucola|Salat'], ['Süßkartoffeln würfeln, mit Kichererbsen, Zwiebel, Öl, Paprikapulver und Salz mischen.', '30 Minuten bei 200 °C rösten.', 'Mit Spinat oder Rucola und einem Zitronen-Dressing servieren.']],
    ['Minestrone', 40, 2, ['Karotte|Möhre|Karotten', 'Zucchini', 'Kartoffeln|Kartoffel', 'Tomaten|Dosentomaten|Passierte Tomaten', 'Bohnen|Weiße Bohnen|Kidneybohnen', 'Nudeln|Suppennudeln'], ['Gemüse würfeln und in Olivenöl andünsten.', 'Tomaten und 1 l Brühe dazu, 15 Minuten köcheln.', 'Bohnen und Nudeln dazugeben und weich kochen, mit Kräutern abschmecken.']],
    ['Pilz-Stroganoff vegan', 25, 2, ['Champignons|Pilze', 'Zwiebel', 'Hafersahne|Sojasahne|Pflanzensahne|Kokosmilch', 'Senf', 'Nudeln|Reis|Kartoffeln'], ['Pilze scharf anbraten, Zwiebel dazugeben.', 'Mit Pflanzensahne ablöschen, Senf und Paprikapulver einrühren.', '5 Minuten köcheln, mit Nudeln oder Reis servieren.']],
    ['Overnight Oats vegan', 5, 2, ['Haferflocken', 'Haferdrink|Sojadrink|Pflanzenmilch|Mandeldrink', 'Banane|Beeren|Apfel', 'Nüsse|Chiasamen|Leinsamen'], ['Haferflocken mit doppelter Menge Pflanzendrink mischen.', 'Über Nacht in den Kühlschrank stellen.', 'Morgens mit Obst und Nüssen toppen.']],
    ['Bohnen-Tacos', 20, 2, ['Tortilla|Wraps|Tacos', 'Kidneybohnen|Schwarze Bohnen|Bohnen', 'Mais', 'Avocado', 'Tomaten|Salsa'], ['Bohnen mit Kreuzkümmel, Paprika und Salz in der Pfanne erhitzen und leicht zerdrücken.', 'Avocado zerdrücken, mit Limette und Salz würzen.', 'Tortillas füllen mit Bohnen, Mais, Tomaten und Avocado.']],
    ['Ratatouille', 45, 2, ['Aubergine', 'Zucchini', 'Paprika', 'Tomaten|Dosentomaten', 'Zwiebel', 'Knoblauch'], ['Gemüse würfeln, Zwiebel und Knoblauch andünsten.', 'Aubergine, Paprika und Zucchini nacheinander anbraten.', 'Tomaten und Kräuter der Provence dazu, 25 Minuten schmoren.']],
    ['Kürbissuppe mit Kokos', 35, 2, ['Kürbis|Hokkaido', 'Kokosmilch', 'Zwiebel', 'Ingwer', 'Brühe|Gemüsebrühe'], ['Kürbis (Hokkaido mit Schale) und Zwiebel würfeln, mit Ingwer andünsten.', 'Mit 700 ml Brühe 20 Minuten kochen.', 'Kokosmilch dazu, fein pürieren und abschmecken.']],
    ['Asia-Nudelsuppe', 20, 2, ['Reisnudeln|Mie-Nudeln|Nudeln', 'Brühe|Gemüsebrühe', 'Pak Choi|Spinat|Brokkoli', 'Pilze|Champignons|Shiitake', 'Sojasauce|Sojasoße', 'Ingwer'], ['Brühe mit Ingwer und Sojasauce aufkochen.', 'Pilze und Gemüse 5 Minuten darin garen.', 'Nudeln dazugeben, ziehen lassen, mit Frühlingszwiebeln und Chili servieren.']],
    ['Gemüse-Paella', 40, 2, ['Reis|Paellareis|Risottoreis', 'Paprika', 'Erbsen', 'Tomaten', 'Zwiebel', 'Brühe|Gemüsebrühe'], ['Zwiebel und Paprika in einer großen Pfanne anbraten, Reis kurz mitrösten.', 'Tomaten, Paprikapulver (oder Safran) und 700 ml Brühe dazu.', '20 Minuten ohne Rühren garen, Erbsen in den letzten 5 Minuten dazu.']],
    ['Tofu-Reis-Bowl', 25, 2, ['Tofu', 'Reis', 'Edamame|Erbsen|Brokkoli', 'Gurke|Karotte|Rotkohl', 'Sojasauce|Sojasoße'], ['Reis kochen, Tofu in Würfeln knusprig braten.', 'Gemüse schneiden bzw. Edamame kurz garen.', 'Alles in Schüsseln anrichten, mit Sojasauce und Sesam toppen.']],
    ['Pesto-Nudeln mit Gemüse', 20, 2, ['Nudeln|Spaghetti|Pasta', 'Zucchini', 'Cherrytomaten|Tomaten', 'Basilikum', 'Pinienkerne|Nüsse|Sonnenblumenkerne'], ['Nudeln kochen.', 'Basilikum mit Kernen, Öl, Knoblauch und Salz zu Pesto mixen.', 'Zucchini und Tomaten anbraten, mit Nudeln und Pesto mischen.']],
  ];
  const recipes = R.map(([title, time, veg, ing, steps]) => ({ title, time, veg: veg >= 1, vegan: veg === 2, ing: ing.map(i => i.split('|')), steps }));
  const norm = s => String(s || '').toLowerCase().normalize('NFC').replace(/[^a-zäöüß ]/g, ' ').replace(/\s+/g, ' ').trim();
  const stem = s => s.replace(/(en|n|e|s)$/, '');

  function has(pantryNames, alts) {
    for (const a of alts) {
      const an = norm(a), as = stem(an);
      for (const p of pantryNames) {
        if (p.n === an || stem(p.n) === as) return p;
        if (an.length > 3 && (p.words.includes(an) || p.words.some(w => stem(w) === as))) return p;
        if (an.length > 4 && p.n.includes(an)) return p;
      }
    }
    return null;
  }

  function suggest(pantry, hint, limit, prefs) {
    prefs = prefs || {};
    const pn = pantry.map(p => { const n = norm(p.name); return { n, words: n.split(' '), soon: p.soon, name: p.name }; });
    hint = norm(hint);
    const wantVegan = /vegan|pflanzlich/.test(hint), wantVeg = wantVegan || /vegetar|ohne fleisch/.test(hint), quick = /schnell|wenig zeit|zügig|fix/.test(hint);
    const words = hint.split(' ').filter(w => w.length > 3 && !/vegetar|vegan|pflanzlich|schnell|ohne|fleisch|bitte|etwas|heute/.test(w));
    const out = [];
    for (const r of recipes) {
      if (wantVegan && !r.vegan) continue;
      if (wantVeg && !r.veg) continue;
      const rs = (prefs.recipe || {})[r.title] || 0; if (rs <= -2) continue;
      if (quick && r.time > 25) continue;
      const uses = [], missing = []; let soon = 0;
      r.ing.forEach(alts => { const hit = has(pn, alts); if (hit) { uses.push(hit.name); if (hit.soon) soon++; } else missing.push(alts[0]); });
      let score = uses.length / r.ing.length + soon * 0.25 + rs * 0.2;
      const tags = prefs.tags || {}; score += 0.05 * ((r.vegan ? tags.vegan || 0 : 0) + (r.veg ? tags.veg || 0 : tags.meat || 0) + (r.time <= 20 ? tags.quick || 0 : 0));
      if (words.length && words.some(w => norm(r.title).includes(stem(w)) || r.ing.some(a => a.some(x => norm(x).includes(stem(w)))))) score += 0.5;
      if (!uses.length && !words.length && !wantVeg && !quick) continue;
      out.push({ title: r.title, time: r.time + ' Min.', veg: r.veg, vegan: r.vegan, liked: rs > 0, uses: [...new Set(uses)], missing, steps: r.steps, score, soon });
    }
    out.sort((a, b) => b.score - a.score || a.missing.length - b.missing.length);
    return out.slice(0, limit || 8);
  }
  root.HRecipes = { suggest, recipes };
})(typeof window !== 'undefined' ? window : globalThis);
