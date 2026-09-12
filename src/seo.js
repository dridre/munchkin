// Texto de la portada, por idioma. Es la unica fuente: de aqui salen la cabecera
// y el contenido rastreable de las seis paginas estaticas que genera
// `scripts/pages.mjs`, y tambien la seccion "que es esto" que ve una persona al
// final de la pantalla de inicio.
//
// Tiene que ser lo segundo, no solo lo primero: Google ejecuta JavaScript, asi
// que indexa el DOM ya montado. Un texto que la app borra al arrancar no cuenta,
// y esconderlo despues seria encubrimiento.

export const SEO = {
  es: {
    lang: 'es',
    name: 'Munchkin Contador de Niveles',
    title: 'Munchkin Contador de Niveles y Equipo — gratis y online',
    description:
      'Contador de niveles, equipo y desventajas para Munchkin. Cada jugador lleva su personaje desde su móvil y la pantalla de la mesa muestra quién va ganando. Gratis, sin cuentas y funciona sin internet.',
    lead: 'Contador de niveles para partidas de Munchkin y otros juegos de mesa de mazmorreo. La pantalla que dejas en el centro de la mesa reparte el espacio según el poder de cada jugador, así que de un vistazo se ve quién va ganando sin preguntar.',
    featuresTitle: 'Qué hace',
    features: [
      'Cuenta nivel, equipo y desventajas de cada jugador, y calcula el poder total.',
      'El tablero reparte la pantalla en bloques proporcionales al poder: el que va primero ocupa más sitio.',
      'Salas con código de cuatro letras y código QR: cada uno entra con su móvil y lleva su propio personaje.',
      'Nivel objetivo configurable: 10 el estándar, 20 para las partidas largas, o lo que juegue tu grupo.',
      'Se instala como aplicación y funciona sin internet: la partida se guarda en el aparato.',
      'Gratis, sin cuentas, sin anuncios y sin registro.',
    ],
    howTitle: 'Cómo se usa',
    how: [
      'Apunta a quién juega, elige a qué nivel se gana y empieza la partida.',
      'Crea una sala: sale un código de cuatro letras y un QR.',
      'Cada jugador escanea el QR con el móvil, coge su personaje y sube o baja sus contadores.',
    ],
    faqTitle: 'Preguntas',
    faq: [
      {
        q: '¿Hace falta instalar algo?',
        a: 'No. Se abre en el navegador. Si quieres, se instala como aplicación desde el propio navegador y entonces funciona sin conexión y sin barra de direcciones.',
      },
      {
        q: '¿Se puede jugar sin internet?',
        a: 'Sí. En un solo aparato funciona todo sin conexión. Internet solo hace falta para las salas, que es cuando cada jugador usa su propio móvil.',
      },
      {
        q: '¿Cuántos jugadores admite?',
        a: 'Hasta ocho, cada uno con su color. Se pueden añadir y quitar en cualquier momento de la partida.',
      },
      {
        q: '¿Guarda mis datos?',
        a: 'No hay cuentas ni registro. La partida se guarda en tu propio aparato, y las salas solo guardan los nombres durante la partida: se borran solas a las 24 horas.',
      },
    ],
    langsTitle: 'Idiomas',
    langsText: 'Disponible en español, inglés, francés, alemán, italiano y portugués.',
    aboutTitle: 'Qué es esto',
  },

  en: {
    lang: 'en',
    name: 'Munchkin Level Counter',
    title: 'Munchkin Level Counter — free online level and gear tracker',
    description:
      'Level, gear and penalty counter for Munchkin. Every player runs their own character from their phone while the table screen shows who is winning. Free, no accounts, works offline.',
    lead: 'A level counter for Munchkin and other dungeon-crawl board games. The screen you leave in the middle of the table splits itself by each player’s power, so you can see who is winning at a glance without asking.',
    featuresTitle: 'What it does',
    features: [
      'Tracks level, gear and penalties for every player, and works out total power.',
      'The board splits the screen into blocks proportional to power: whoever leads takes up more room.',
      'Rooms with a four-letter code and a QR code: everyone joins from their phone and runs their own character.',
      'Configurable target level: 10 as standard, 20 for long games, or whatever your group plays to.',
      'Installs as an app and works offline: the game is saved on your device.',
      'Free, no accounts, no ads, no sign-up.',
    ],
    howTitle: 'How to use it',
    how: [
      'Write down who is playing, pick the level you win at, and start the game.',
      'Create a room: you get a four-letter code and a QR code.',
      'Each player scans the QR with their phone, takes their character, and moves their own counters.',
    ],
    faqTitle: 'Questions',
    faq: [
      {
        q: 'Do I need to install anything?',
        a: 'No. It runs in the browser. If you want, install it as an app straight from the browser and then it works offline with no address bar.',
      },
      {
        q: 'Can I play without internet?',
        a: 'Yes. On a single device everything works offline. Internet is only needed for rooms, which is when each player uses their own phone.',
      },
      {
        q: 'How many players does it take?',
        a: 'Up to eight, each with their own colour. You can add and remove them at any point during the game.',
      },
      {
        q: 'Does it keep my data?',
        a: 'There are no accounts and no sign-up. The game is saved on your own device, and rooms only hold names while you play: they delete themselves after 24 hours.',
      },
    ],
    langsTitle: 'Languages',
    langsText: 'Available in English, Spanish, French, German, Italian and Portuguese.',
    aboutTitle: 'What this is',
  },

  fr: {
    lang: 'fr',
    name: 'Munchkin Compteur de Niveaux',
    title: 'Munchkin Compteur de Niveaux et d’Équipement — gratuit en ligne',
    description:
      'Compteur de niveaux, d’équipement et de malus pour Munchkin. Chaque joueur gère son personnage depuis son téléphone et l’écran de table montre qui est en tête. Gratuit, sans compte, marche hors ligne.',
    lead: 'Un compteur de niveaux pour Munchkin et autres jeux de société d’exploration de donjon. L’écran posé au milieu de la table se partage selon la puissance de chaque joueur : on voit d’un coup d’œil qui est en tête, sans demander.',
    featuresTitle: 'Ce qu’il fait',
    features: [
      'Compte le niveau, l’équipement et les malus de chaque joueur, et calcule la puissance totale.',
      'Le plateau découpe l’écran en blocs proportionnels à la puissance : celui qui mène occupe plus de place.',
      'Des salles avec un code de quatre lettres et un QR code : chacun rejoint depuis son téléphone et gère son personnage.',
      'Niveau visé réglable : 10 par défaut, 20 pour les longues parties, ou ce que joue votre groupe.',
      'S’installe comme une application et marche hors ligne : la partie est enregistrée sur l’appareil.',
      'Gratuit, sans compte, sans publicité et sans inscription.',
    ],
    howTitle: 'Comment s’en servir',
    how: [
      'Note qui joue, choisis le niveau qui fait gagner, et lance la partie.',
      'Crée une salle : tu obtiens un code de quatre lettres et un QR code.',
      'Chaque joueur scanne le QR avec son téléphone, prend son personnage et bouge ses propres compteurs.',
    ],
    faqTitle: 'Questions',
    faq: [
      {
        q: 'Faut-il installer quelque chose ?',
        a: 'Non. Ça s’ouvre dans le navigateur. Si tu veux, installe-le comme application depuis le navigateur : il marche alors hors ligne et sans barre d’adresse.',
      },
      {
        q: 'Peut-on jouer sans internet ?',
        a: 'Oui. Sur un seul appareil tout marche hors ligne. Internet ne sert que pour les salles, quand chaque joueur utilise son propre téléphone.',
      },
      {
        q: 'Combien de joueurs ?',
        a: 'Jusqu’à huit, chacun avec sa couleur. On peut en ajouter et en retirer à tout moment pendant la partie.',
      },
      {
        q: 'Est-ce que mes données sont gardées ?',
        a: 'Il n’y a ni compte ni inscription. La partie est enregistrée sur ton appareil, et les salles ne gardent les prénoms que le temps de jouer : elles s’effacent au bout de 24 heures.',
      },
    ],
    langsTitle: 'Langues',
    langsText: 'Disponible en français, espagnol, anglais, allemand, italien et portugais.',
    aboutTitle: 'C’est quoi',
  },

  de: {
    lang: 'de',
    name: 'Munchkin Levelzähler',
    title: 'Munchkin Levelzähler — Level- und Ausrüstungszähler kostenlos online',
    description:
      'Zähler für Level, Ausrüstung und Malus bei Munchkin. Jeder führt seinen Charakter auf dem eigenen Handy, der Tisch-Bildschirm zeigt, wer vorne liegt. Kostenlos, ohne Konto, auch offline.',
    lead: 'Ein Levelzähler für Munchkin und andere Dungeon-Brettspiele. Der Bildschirm in der Tischmitte teilt sich nach der Stärke jedes Spielers auf, sodass man auf einen Blick sieht, wer vorne liegt, ohne zu fragen.',
    featuresTitle: 'Was es kann',
    features: [
      'Zählt Level, Ausrüstung und Malus jedes Spielers und rechnet die Gesamtstärke aus.',
      'Das Spielfeld teilt den Bildschirm in Blöcke nach Stärke: wer führt, bekommt mehr Platz.',
      'Räume mit vierstelligem Code und QR-Code: jeder kommt per Handy dazu und führt seinen Charakter.',
      'Einstellbares Ziellevel: 10 als Standard, 20 für lange Partien, oder was deine Gruppe spielt.',
      'Lässt sich als App installieren und läuft offline: das Spiel bleibt auf dem Gerät.',
      'Kostenlos, ohne Konto, ohne Werbung, ohne Anmeldung.',
    ],
    howTitle: 'So geht es',
    how: [
      'Trag ein, wer mitspielt, wähle das Ziellevel und starte die Partie.',
      'Erstelle einen Raum: du bekommst einen vierstelligen Code und einen QR-Code.',
      'Jeder scannt den QR-Code mit dem Handy, nimmt seinen Charakter und stellt seine eigenen Zähler.',
    ],
    faqTitle: 'Fragen',
    faq: [
      {
        q: 'Muss ich etwas installieren?',
        a: 'Nein. Es läuft im Browser. Wenn du magst, installierst du es direkt aus dem Browser als App, dann geht es offline und ohne Adressleiste.',
      },
      {
        q: 'Geht das ohne Internet?',
        a: 'Ja. Auf einem Gerät läuft alles offline. Internet braucht man nur für Räume, also wenn jeder sein eigenes Handy benutzt.',
      },
      {
        q: 'Wie viele Spieler?',
        a: 'Bis zu acht, jeder mit eigener Farbe. Man kann jederzeit während der Partie welche hinzufügen oder entfernen.',
      },
      {
        q: 'Werden meine Daten gespeichert?',
        a: 'Es gibt kein Konto und keine Anmeldung. Das Spiel liegt auf deinem Gerät, und Räume halten die Namen nur während der Partie: nach 24 Stunden löschen sie sich selbst.',
      },
    ],
    langsTitle: 'Sprachen',
    langsText: 'Verfügbar auf Deutsch, Spanisch, Englisch, Französisch, Italienisch und Portugiesisch.',
    aboutTitle: 'Was das ist',
  },

  it: {
    lang: 'it',
    name: 'Munchkin Contatore di Livelli',
    title: 'Munchkin Contatore di Livelli ed Equipaggiamento — gratis online',
    description:
      'Contatore di livelli, equipaggiamento e malus per Munchkin. Ognuno gestisce il suo personaggio dal telefono e lo schermo al centro mostra chi è in testa. Gratis, senza account, funziona offline.',
    lead: 'Un contatore di livelli per Munchkin e altri giochi da tavolo di esplorazione di dungeon. Lo schermo che lasci al centro del tavolo si divide in base alla forza di ogni giocatore: si vede a occhio chi è in testa, senza chiedere.',
    featuresTitle: 'Cosa fa',
    features: [
      'Conta livello, equipaggiamento e malus di ogni giocatore, e calcola la forza totale.',
      'Il tavolo divide lo schermo in blocchi proporzionali alla forza: chi è in testa occupa più spazio.',
      'Stanze con codice di quattro lettere e codice QR: ognuno entra dal telefono e gestisce il suo personaggio.',
      'Livello obiettivo regolabile: 10 di serie, 20 per le partite lunghe, o quello che gioca il tuo gruppo.',
      'Si installa come applicazione e funziona offline: la partita resta sull’apparecchio.',
      'Gratis, senza account, senza pubblicità e senza registrazione.',
    ],
    howTitle: 'Come si usa',
    how: [
      'Segna chi gioca, scegli a che livello si vince e comincia la partita.',
      'Crea una stanza: escono un codice di quattro lettere e un QR.',
      'Ogni giocatore inquadra il QR col telefono, prende il suo personaggio e muove i suoi contatori.',
    ],
    faqTitle: 'Domande',
    faq: [
      {
        q: 'Devo installare qualcosa?',
        a: 'No. Si apre nel browser. Se vuoi, si installa come applicazione dal browser stesso e allora funziona offline e senza barra degli indirizzi.',
      },
      {
        q: 'Si può giocare senza internet?',
        a: 'Sì. Su un solo apparecchio funziona tutto offline. Internet serve solo per le stanze, cioè quando ognuno usa il proprio telefono.',
      },
      {
        q: 'Quanti giocatori?',
        a: 'Fino a otto, ognuno col suo colore. Si possono aggiungere e togliere in qualsiasi momento della partita.',
      },
      {
        q: 'Conserva i miei dati?',
        a: 'Non ci sono account né registrazione. La partita resta sul tuo apparecchio, e le stanze tengono i nomi solo mentre giochi: si cancellano da sole dopo 24 ore.',
      },
    ],
    langsTitle: 'Lingue',
    langsText: 'Disponibile in italiano, spagnolo, inglese, francese, tedesco e portoghese.',
    aboutTitle: 'Cos’è',
  },

  pt: {
    lang: 'pt',
    name: 'Munchkin Contador de Níveis',
    title: 'Munchkin Contador de Níveis e Equipamento — grátis e online',
    description:
      'Contador de níveis, equipamento e penalidades para Munchkin. Cada um cuida do seu personagem pelo celular e a tela da mesa mostra quem está na frente. Grátis, sem conta, funciona sem internet.',
    lead: 'Um contador de níveis para Munchkin e outros jogos de tabuleiro de masmorra. A tela que fica no meio da mesa se divide conforme a força de cada jogador, então dá para ver num relance quem está na frente sem precisar perguntar.',
    featuresTitle: 'O que faz',
    features: [
      'Conta nível, equipamento e penalidades de cada jogador, e calcula a força total.',
      'O tabuleiro divide a tela em blocos proporcionais à força: quem está na frente ocupa mais espaço.',
      'Salas com código de quatro letras e código QR: cada um entra pelo celular e cuida do seu personagem.',
      'Nível objetivo configurável: 10 no padrão, 20 para partidas longas, ou o que o seu grupo jogar.',
      'Instala como aplicativo e funciona sem internet: a partida fica salva no aparelho.',
      'Grátis, sem conta, sem anúncios e sem cadastro.',
    ],
    howTitle: 'Como usar',
    how: [
      'Anote quem está jogando, escolha em que nível se ganha e comece a partida.',
      'Crie uma sala: sai um código de quatro letras e um QR.',
      'Cada jogador aponta a câmera para o QR, pega seu personagem e mexe nos próprios contadores.',
    ],
    faqTitle: 'Perguntas',
    faq: [
      {
        q: 'Preciso instalar algo?',
        a: 'Não. Abre no navegador. Se quiser, instala como aplicativo pelo próprio navegador e aí funciona sem internet e sem barra de endereço.',
      },
      {
        q: 'Dá para jogar sem internet?',
        a: 'Sim. Num aparelho só, tudo funciona sem internet. Ela só é necessária para as salas, quando cada um usa o próprio celular.',
      },
      {
        q: 'Quantos jogadores?',
        a: 'Até oito, cada um com sua cor. Dá para adicionar e tirar em qualquer momento da partida.',
      },
      {
        q: 'Guarda meus dados?',
        a: 'Não tem conta nem cadastro. A partida fica no seu aparelho, e as salas guardam os nomes só durante o jogo: elas se apagam sozinhas em 24 horas.',
      },
    ],
    langsTitle: 'Idiomas',
    langsText: 'Disponível em português, espanhol, inglês, francês, alemão e italiano.',
    aboutTitle: 'O que é isto',
  },
}

// El español vive en la raiz; los demas en su carpeta.
export const PATHS = { es: '/', en: '/en/', fr: '/fr/', de: '/de/', it: '/it/', pt: '/pt/' }
export const SITE = 'https://munchkin-btb.pages.dev'
