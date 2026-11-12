# Veilleuse — orologio da comodino (PWA)

Web app per iPhone che mostra l'ora in grande, con luce tenue, su sfondo nero assoluto.
Funziona completamente offline. L'interfaccia è in francese.

## Uso

- **Tocco singolo** sullo schermo nero (fuori dalla fascia oraria): l'ora compare per 10 secondi.
- **Pressione prolungata (2 s)** in qualsiasi momento: apre i *Réglages* (impostazioni).
- **Réglages**: colore delle cifre (8 colori), luminosità, ora di accensione (*Allumage*,
  default 4:30), ora di spegnimento (*Extinction*, default 7:00) con interruttore per
  disattivarla. Se lo spegnimento è disattivato, l'ora resta visibile dall'accensione fino a
  mezzanotte. Le fasce che passano la mezzanotte (es. 22:00–7:00) sono gestite.
- **Sveglia (*Réveil*)**: nelle impostazioni attiva *Réveil*, scegli l'ora e tocca
  *Choisir un son…* per prendere un file audio (mp3, m4a…) dall'app **File**. Il file viene
  copiato dentro l'app e funziona anche offline / in modalità aereo. All'ora scelta parte
  **solo l'audio**, in loop (massimo 30 minuti); lo schermo resta com'è. **Tocca lo schermo per
  fermarlo.** *Écouter* serve a provarlo.
- Le impostazioni restano salvate anche dopo la chiusura dell'app.
- Ogni minuto l'orario si sposta di pochi pixel (protezione dello schermo OLED).
- Se in basso compare la scritta *« Écran : veille non bloquée — touchez l'écran »*, il blocco
  dello schermo non è attivo: tocca una volta lo schermo.

---

## 1. Pubblicare su GitHub Pages

Serve un indirizzo HTTPS: GitHub Pages lo fornisce gratis.

1. Apri **github.com** e vai al repository **watch_screen**.
2. Se i file sono in una pull request, aprila e premi **Merge pull request** → **Confirm merge**.
   (In alternativa puoi pubblicare direttamente il ramo `claude/determined-maxwell-0w89pi`.)
3. In alto clicca **Settings** (Impostazioni).
4. Nella colonna a sinistra clicca **Pages**.
5. Sotto **Build and deployment** → **Source**, scegli **Deploy from a branch**.
6. Sotto **Branch** scegli il ramo che contiene i file (`main`, oppure quello indicato sopra),
   cartella **/ (root)**, poi **Save**.
7. Attendi 1–2 minuti e ricarica la pagina: in alto comparirà
   *« Your site is live at https://chiarutto.github.io/watch_screen/ »*.

Nota: con un account GitHub gratuito, Pages funziona solo se il repository è **pubblico**
(Settings → General → in fondo, *Change visibility*).

## 2. Installare sull'iPhone

1. Sull'iPhone apri **Safari** (deve essere Safari) e vai su
   `https://chiarutto.github.io/watch_screen/`.
2. Attendi qualche secondo che la pagina sia caricata completamente (così viene salvata per l'uso offline).
3. Tocca il pulsante **Condividi** (quadrato con la freccia verso l'alto).
4. Scorri e tocca **Aggiungi alla schermata Home**. Lascia attivo *Apri come app web*, se presente.
5. Tocca **Aggiungi**. Compare l'icona **Veilleuse**.
6. Apri l'app **dall'icona** (non da Safari): così non c'è nessuna barra di Safari.
7. Tocca una volta lo schermo per attivare il blocco dello schermo acceso.

## 3. Verificare il funzionamento offline

1. Apri l'app dall'icona almeno una volta con internet attivo, poi chiudila.
2. Attiva la **modalità aereo** (Centro di Controllo → icona aereo). Disattiva anche il Wi-Fi.
3. Chiudi del tutto l'app (scorri dal basso verso l'alto e mettila in pausa, poi scorrila via).
4. Riaprila dall'icona: deve mostrare l'orologio normalmente.
5. Tieni premuto 2 s: devono aprirsi le impostazioni. Chiudi.
6. Lascia l'iPhone fermo qualche minuto: lo schermo non deve spegnersi.

---

## Consigli d'uso

- **Blocco automatico su « Mai »** come riserva: Impostazioni → Schermo e luminosità →
  Blocco automatico → Mai. Se per qualsiasi motivo il blocco dello schermo dell'app non
  funziona, lo schermo resta comunque acceso. Ricordati di rimetterlo al mattino se vuoi.
- **Riduci punto di bianco** per abbassare ancora la luce, sotto il minimo normale:
  Impostazioni → Accessibilità → Schermo e dimensioni testo → Riduci punto di bianco
  (es. 80–100%). Comodo da attivare con un *Abbreviazione accessibilità* (triplo clic sul tasto
  laterale): Accessibilità → Abbreviazione accessibilità → Riduci punto di bianco.
- **Nessuna notifica sopra l'orologio**: attiva la Full Immersion **Sonno** (o *Non disturbare*)
  oppure la **modalità aereo**.
- **Usalo in orizzontale**: in orizzontale iOS nasconde la barra di stato (ora, batteria),
  che in verticale resta visibile in bianco e non può essere nascosta da una web app.
- Tieni l'iPhone **in carica**: lo schermo sempre acceso consuma batteria, anche se il nero su
  OLED consuma pochissimo.
- Il colore rosso o ambra con luminosità bassa è il meno disturbante per il sonno.

## Sveglia: cose importanti

- **Ogni sera, dopo aver aperto l'app, tocca lo schermo una volta.** iOS non permette a una
  pagina web di far partire un suono senza un tocco: il tocco "arma" la sveglia. Finché non
  l'hai fatto, in basso compare la scritta *« Réveil : touchez l'écran une fois pour l'armer »*.
  Se l'app va in secondo piano (passi a un'altra app, blocchi il telefono), va riarmata.
- **Il volume è quello dei tasti laterali dell'iPhone** (volume dei contenuti multimediali, non
  della suoneria). Controllalo la sera prima di dormire.
- Se iOS blocca comunque il suono, l'orario si accende al massimo della luminosità con la scritta
  *« Réveil — touchez l'écran pour arrêter »*: è un ripiego, non sveglia nessuno.
- **Non è affidabile quanto la sveglia dell'app Orologio di iOS.** Se l'app viene chiusa, il
  telefono si blocca o la batteria si scarica, non suona. Per svegliarti davvero, tieni anche
  una sveglia di riserva nell'app Orologio qualche minuto dopo.
- Prova la sveglia una prima volta impostandola 2–3 minuti avanti.
- YouTube non è supportato: serve internet, iOS non lascia partire l'audio da solo e le regole di
  YouTube vietano di usarne solo l'audio.

## Limiti noti

- Su iOS una web app non può riaccendere lo schermo da sola: se l'iPhone si blocca (tasto laterale,
  batteria scarica), l'orologio si ferma finché non lo riapri.
- Su versioni recenti di iOS la Screen Wake Lock funziona anche nelle app aggiunte alla Home;
  se non fosse disponibile, l'app usa un video nero muto in loop (avviato al primo tocco).
  Il « Blocco automatico: Mai » resta la garanzia più solida.

## Aggiornare l'app

Dopo aver modificato i file, cambia `VERSION` in `sw.js` (es. `veilleuse-v2`), pubblica, poi
apri l'app due volte con internet attivo: la seconda volta parte la nuova versione.

## File

| File | Ruolo |
|---|---|
| `index.html` | pagina principale |
| `style.css` | aspetto |
| `app.js` | orologio, fascia oraria, sveglia, gesti, impostazioni, schermo acceso |
| `sw.js` | service worker (cache offline) |
| `manifest.json` | dati per l'installazione come app |
| `icons/` | icone della schermata Home |
| `media/silence.m4a` | silenzio usato per "armare" l'audio della sveglia |
| `media/veille.mp4` | video nero muto di riserva per tenere lo schermo acceso |
| `.nojekyll` | dice a GitHub Pages di servire i file così come sono |
