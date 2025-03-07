copilot-checkpoints-mscode-v2/
├── src/
│   ├── extension.ts            # Point d'entrée principal
│   ├── config/                 # Configuration
│   │   └── providerConfig.ts   # Configuration des providers IA
│   ├── providers/             # Implémentations des providers IA
│   │   ├── deepseekProvider.ts
│   │   ├── mistralProvider.ts
│   │   ├── geminiProvider.ts
│   │   ├── groqProvider.ts
│   │   ├── claudeProvider.ts
│   │   ├── openaiProvider.ts
│   │   └── index.ts           # Export commun
│   ├── checkpointManager/     # Gestion des versions
│   │   ├── checkpointManager.ts
│   │   ├── fileStorage.ts     # Gestion du stockage des fichiers
│   │   ├── historyManager.ts  # Gestion de l'historique
│   │   └── utils.ts
│   └── webviews/              # Interfaces utilisateur
│       ├── checkpointPanel.ts # Panel principal
│       └── resources/         # Ressources pour l'interface
├── fileicons/                 # Icônes pour les fichiers
├── media/                     # Ressources graphiques
│   ├── checkpoint-blue.svg    # Icône état initial
│   ├── checkpoint-red.svg     # Icône checkpoints standards
│   ├── checkpoint-yellow.svg  # Icône version en cours
│   └── checkpoint-green.svg   # Icône dernière version validée
└── resources/                 # Autres ressources
    ├── icon.png
    └── icon.svg