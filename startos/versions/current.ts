import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.0:0',
  releaseNotes: {
    en_US: [
      'SimpleX Websocket Bridge runs SimpleX Chat headless and exposes the SimpleX network over a token-authenticated Websocket API, so bots, AI agents, scripts, and other StartOS services can send and receive SimpleX messages and files programmatically.',
      '',
      '- Outside access is gated by per-client bearer tokens, managed in the API Keys action; same-box services connect directly.',
      '- Actions to configure the SimpleX profile, create one-time invitation links, and reset the identity.',
      '- Shared-volume file exchange for consumer packages via /simplex/inbound and /simplex/outbound.',
      '- Bundles simplex-chat v6.5.4.',
    ].join('\n'),
    es_ES: [
      'SimpleX Websocket Bridge ejecuta SimpleX Chat sin interfaz y expone la red SimpleX a través de una API Websocket autenticada por token, para que bots, agentes de IA, scripts y otros servicios de StartOS puedan enviar y recibir mensajes y archivos de SimpleX de forma programática.',
      '',
      '- El acceso externo se protege con tokens bearer por cliente, gestionados en la acción API Keys; los servicios del mismo equipo se conectan directamente.',
      '- Acciones para configurar el perfil de SimpleX, crear enlaces de invitación de un solo uso y restablecer la identidad.',
      '- Intercambio de archivos mediante volumen compartido para paquetes consumidores a través de /simplex/inbound y /simplex/outbound.',
      '- Incluye simplex-chat v6.5.4.',
    ].join('\n'),
    de_DE: [
      'SimpleX Websocket Bridge betreibt SimpleX Chat im Headless-Modus und stellt das SimpleX-Netzwerk über eine token-authentifizierte Websocket-API bereit, sodass Bots, KI-Agenten, Skripte und andere StartOS-Dienste SimpleX-Nachrichten und -Dateien programmatisch senden und empfangen können.',
      '',
      '- Externer Zugriff wird durch clientspezifische Bearer-Token abgesichert, verwaltet in der Aktion „API Keys“; Dienste auf demselben Gerät verbinden sich direkt.',
      '- Aktionen zum Konfigurieren des SimpleX-Profils, zum Erstellen einmaliger Einladungslinks und zum Zurücksetzen der Identität.',
      '- Dateiaustausch über ein gemeinsames Volume für konsumierende Pakete via /simplex/inbound und /simplex/outbound.',
      '- Enthält simplex-chat v6.5.4.',
    ].join('\n'),
    pl_PL: [
      'SimpleX Websocket Bridge uruchamia SimpleX Chat w trybie bezgłowym i udostępnia sieć SimpleX poprzez uwierzytelniane tokenem API Websocket, dzięki czemu boty, agenci AI, skrypty i inne usługi StartOS mogą programowo wysyłać i odbierać wiadomości oraz pliki SimpleX.',
      '',
      '- Dostęp z zewnątrz jest chroniony tokenami bearer dla każdego klienta, zarządzanymi w akcji „API Keys”; usługi na tym samym urządzeniu łączą się bezpośrednio.',
      '- Akcje do konfiguracji profilu SimpleX, tworzenia jednorazowych linków zaproszeń i resetowania tożsamości.',
      '- Wymiana plików przez współdzielony wolumin dla pakietów konsumujących poprzez /simplex/inbound i /simplex/outbound.',
      '- Zawiera simplex-chat v6.5.4.',
    ].join('\n'),
    fr_FR: [
      'SimpleX Websocket Bridge exécute SimpleX Chat sans interface et expose le réseau SimpleX via une API Websocket authentifiée par jeton, afin que les bots, agents IA, scripts et autres services StartOS puissent envoyer et recevoir des messages et fichiers SimpleX de façon programmatique.',
      '',
      "- L'accès externe est protégé par des jetons bearer propres à chaque client, gérés dans l'action « API Keys » ; les services du même appareil se connectent directement.",
      "- Des actions pour configurer le profil SimpleX, créer des liens d'invitation à usage unique et réinitialiser l'identité.",
      '- Échange de fichiers via un volume partagé pour les paquets consommateurs à travers /simplex/inbound et /simplex/outbound.',
      '- Inclut simplex-chat v6.5.4.',
    ].join('\n'),
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
