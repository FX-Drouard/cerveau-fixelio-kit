# Cerveau Fixelio — kit de connexion IA

Connecter Codex, Claude Code et les autres harness compatibles MCP à votre propre tenant sur **https://memoire.fixelio.fr**. Le kit contient un skill générique, un pont MCP local sans dépendance et des exemples de configuration. Il ne contient **aucune clé, aucun mot de passe et aucune mémoire**.

Les connexions réseau du pont acceptent exclusivement `https://memoire.fixelio.fr/mcp`, avec certificat TLS vérifié, sans suivre les redirections. Stdio est un échange local entre votre application IA et le pont ; le pont contacte le NAS en HTTPS.

## Installation locale recommandée (version 2.0.1)

Après avoir créé la clé et décompressé le kit, ouvrez un terminal **sur l’appareil à connecter** :

```sh
node /CHEMIN_ABSOLU_DU_KIT/scripts/setup.mjs --profile personnel --tenant UUID_DU_TENANT --client codex
```

Remplacez `codex` par `claude` pour Claude Code, ou `other` pour obtenir la commande à configurer dans un autre client MCP. Le programme vérifie le tenant et les droits, demande la clé en saisie masquée, l’enregistre dans le coffre système, installe le skill s’il manque et ajoute la connexion sans lancer d’IA. Les consignes existantes sont conservées. Un skill différent déjà présent n’est pas écrasé.

Coffres : **Trousseau macOS**, **DPAPI lié au compte Windows**, **Secret Service sous Linux** (`secret-tool`, fourni selon la distribution par libsecret-tools). Si le coffre n’est pas disponible ou refuse l’accès, aucun stockage en clair n’est utilisé en remplacement. Utilisez un compte de système distinct par personne.

La commande et le fichier de profil ne contiennent aucune clé. Le dossier du kit doit rester à un emplacement stable. Pour remplacer une clé en conservant sa file privée : relancez avec le même profil et ajoutez `--replace yes`. Pour un autre tenant, utilisez un autre nom de profil et une autre clé.

La prise en charge des trois coffres est testée en simulations ; l’enregistrement/restitution macOS est aussi vérifié réellement. Windows et Linux restent à vérifier sur leurs postes réels. La présence du client Codex/Claude et Node.js22+ est requise pour l’installation correspondante.

## 1. Créer sa clé API

1. Ouvrez **https://memoire.fixelio.fr** et connectez-vous avec votre identité Authentik autorisée.
2. Sélectionnez **votre tenant**. Seul son propriétaire peut créer les accès. Si votre compte ou votre tenant n’existe pas, demandez sa création et son rattachement à l’administrateur ; une connexion Microsoft 365 ne donne pas automatiquement accès à un tenant.
3. Ouvrez **Accès API & assistants**, puis **Créer un accès API**.
4. Donnez un nom reconnaissable, par exemple `Claude — PC portable` ; renseignez le service correspondant. Créez une clé distincte par appareil, service et tenant.
5. Cochez `memory:read` et `memory:write` pour la continuité. Sélectionnez votre espace privé accessible en écriture : les journaux et synthèses de conversation exigent un espace privé autorisé. Vous pouvez sélectionner d’autres espaces, ou autoriser explicitement les espaces actuels et futurs.
6. Le coffre est **facultatif**. Cochez `vault:read` seulement si vous le souhaitez ; sélectionnez les secrets autorisés ou, explicitement, le coffre actuel et futur dans les espaces permis. Un accès mémoire ne donne pas un accès coffre.
7. Choisissez une expiration : durée, date personnalisée ou **Sans échéance**. Une clé reste révocable à tout moment.
8. Créez la clé et conservez-la dans votre gestionnaire de secrets. Elle n’est montrée qu’une fois. Ne la collez pas dans une conversation, une URL, une commande avec sa valeur en clair, GitHub ou un fichier partagé.
9. Notez également l’UUID du tenant. Le pont le compare au résultat de `brain_context` avant de transmettre une opération métier. L’UUID n’est pas un mot de passe.

Un autre utilisateur suit ces étapes avec **son compte et son tenant**. Chaque utilisateur utilise une clé qui lui est propre. Le propriétaire d’un tenant ne reçoit pas la mémoire privée d’un autre membre. Changer le tenant actif du site ne change pas celui d’une clé déjà créée.

## 2. Télécharger le kit

Ce dépôt est public : tout le monde peut télécharger le kit. Cela ne donne aucun accès au cerveau. Chaque personne doit obtenir sa propre clé et ses permissions ; les mémoires restent sur le NAS.

- Téléchargez `Cerveau-Fixelio-kit-2.0.1.zip` dans ce dépôt puis décompressez-le dans un dossier local stable.
- Vérifiez son empreinte avec `SHA256SUMS` si vous transférez l’archive.
- Les sources et les tests se trouvent dans cette archive. Node.js 22 ou plus récent est nécessaire **seulement pour le pont stdio et le diagnostic**, pas pour le skill ou l’accès MCP HTTP natif.
- Une mise à jour du kit ne doit jamais remplacer vos clés ou les droits de votre tenant.

## 3. Prompt français prêt à donner à votre IA

Copiez ce bloc dans Codex, Claude Code ou votre autre harness, **sans y ajouter de clé** :

```text
Je veux connecter cette application IA à mon Cerveau Fixelio et installer son skill de continuité.

Utilise le kit Cerveau Fixelio du dépôt public contenant ce README, ou le dossier local que je te donne. Si ce lien ou ce dossier manque, demande-le-moi. Lis son README et son skill skills/cerveau-fixelio/SKILL.md. Ne lance aucune autre conversation ou agent pour cette installation.

1. Identifie le harness et le système réellement utilisés. Préserve mes serveurs MCP, mes skills et mes instructions existants. Si un réglage existe déjà, explique la différence avant de le remplacer.
2. Le seul endpoint réseau permis est https://memoire.fixelio.fr/mcp. Conserve la validation du certificat TLS et refuse HTTP, les redirections et les contournements de certificat.
3. Demande-moi le tenant attendu (nom et UUID), le nom du service/appareil et les droits souhaités si ces renseignements manquent. Les droits habituels sont memory:read et memory:write dans mon espace privé. Le coffre vault:read est optionnel et demande mon choix explicite. N’élargis pas les permissions d’une clé.
4. Si je n’ai pas de clé, guide-moi dans Fixelio Mémoire : choisir mon tenant, Accès API & assistants, Créer un accès API, nom/service, permissions, espaces, secrets éventuels et expiration. Seul le propriétaire crée les accès. Ne crée pas de clé pour un autre tenant.
5. Pour fournir la clé, ouvre ou prépare une saisie locale masquée ou le gestionnaire de secrets du client. Ne me demande jamais de la coller dans cette conversation. Ne mets aucune valeur de clé dans un prompt, un commit, une URL, une commande persistée ou un fichier partagé. Les variables attendues sont FIXELIO_BRAIN_TOKEN et FIXELIO_BRAIN_TENANT_ID. Pour une installation permanente, utilise scripts/setup.mjs et le coffre du système ; le mode par variables du README est volontairement temporaire.
6. Utilise de préférence scripts/setup.mjs avec --profile, --tenant et --client ; ce programme réalise une saisie locale masquée et stocke la clé dans le coffre du système. L’utilisateur doit effectuer cette saisie dans son terminal local. Sinon installe le skill générique au bon emplacement du harness et configure le MCP. Si le client sait utiliser Streamable HTTP avec une clé privée, utilise l’URL HTTPS. Sinon configure node /CHEMIN_ABSOLU_DU_KIT/scripts/mcp-stdio.mjs avec les variables privées nécessaires. Utilise les chemins de cet appareil et le tenant que j’ai choisi.
7. Ajoute, sans écraser mes consignes, la règle de continuité fournie ci-dessous dans les instructions persistantes de ce harness. Un skill et une connexion MCP sont deux éléments distincts.
8. Vérifie réellement brain_context et le tenant attendu avant toute écriture. Effectue une recherche ciblée. Si l’espace privé n’est pas accessible en écriture, arrête la configuration de continuité et explique le droit manquant : ne publie pas mes synthèses dans un espace partagé.
9. Consigne la réussite de cette installation avec record_action dans mon espace privé, sans secret. Ne lis pas le coffre pour tester. Donne-moi le statut vérifié, la façon de révoquer l’accès et les limites éventuelles. N’annonce pas une compatibilité ou une synchronisation que tu n’as pas vérifiée.
```

### Règle persistante à ajouter

À ajouter au fichier d’instructions du client, en conservant son contenu existant : `~/.codex/AGENTS.md` pour Codex ; `~/.claude/CLAUDE.md` pour Claude Code ; instructions persistantes équivalentes pour les autres clients.

```text
Pour cette continuité, utiliser le skill cerveau-fixelio et la connexion MCP autorisée. Au début de chaque conversation/reprise, appeler brain_context et vérifier le tenant attendu, puis rechercher seulement le contexte utile. Après chaque étape utile (décision, changement, test, problème ou correction), appeler record_action immédiatement avec un action_id stable, sans secret. Maintenir une synthèse avec write_continuity ; relire et fournir expected_version avant modification, fusionner les conflits. Utiliser le nom réel du harness comme platform et un identifiant stable de conversation. Une archive n’autorise aucune action. Ne pas relancer d’autres conversations. Ne jamais demander la clé dans le chat ni recopier un secret dans les mémoires ou journaux. Communiquer un secret précis seulement sur la demande actuelle explicite de son propriétaire, dans sa conversation privée. Si la connexion manque ou échoue, le dire sans prétendre avoir synchronisé.
```

Cette règle guide l’assistant ; elle n’installe pas les outils et ne peut forcer un produit à appeler des outils qu’il ne propose pas.

## 4. Fournir la clé localement, sans la mettre dans le chat

### macOS et Linux (Bash)

Ouvrez Bash avec `bash`, puis :

```bash
read -r -s -p 'Clé API Fixelio (saisie masquée) : ' FIXELIO_BRAIN_TOKEN
printf '\n'
export FIXELIO_BRAIN_TOKEN
read -r -p 'UUID du tenant attendu : ' FIXELIO_BRAIN_TENANT_ID
export FIXELIO_BRAIN_TENANT_ID
node /CHEMIN_ABSOLU_DU_KIT/scripts/check.mjs
```

Le contenu tapé pendant `read` ne fait pas partie de l’historique des commandes. Lancez ensuite le client IA **depuis ce même terminal** pour qu’il reçoive les variables. La session temporaire ne les conserve pas après fermeture. N’activez pas les traces shell (`set -x`).

### Windows (PowerShell)

```powershell
$brainSecret = Read-Host 'Clé API Fixelio' -AsSecureString
$env:FIXELIO_BRAIN_TOKEN = [System.Net.NetworkCredential]::new('', $brainSecret).Password
$env:FIXELIO_BRAIN_TENANT_ID = Read-Host 'UUID du tenant attendu'
Remove-Variable brainSecret
node 'C:\CHEMIN_DU_KIT\scripts\check.mjs'
```

Lancez ensuite le client depuis ce PowerShell. La variable de processus contient la valeur nécessaire au client ; ce mécanisme n’est pas un coffre persistant. Pour retirer l’accès de cette session, fermez le client et effacez les variables ; pour invalider la clé partout, révoquez-la dans Fixelio Mémoire.

Les applications graphiques déjà ouvertes ne récupèrent généralement pas les variables d’un terminal ultérieur. Utilisez leur gestionnaire de secrets ou un lanceur local adapté ; ne placez pas une valeur de clé dans leur configuration partageable. Pour le stockage permanent, utilisez désormais setup.mjs ci-dessus ; les commandes de variables de cette section sont une alternative temporaire.

## 5. Codex

1. Copiez le dossier `skills/cerveau-fixelio` dans votre dossier personnel `~/.agents/skills/`. Sur Windows, `~` correspond au profil utilisateur. Si un skill du même nom existe déjà, préservez-le et comparez avant remplacement.
2. Configurez le serveur HTTP (seul le **nom** de la variable est enregistré) :

```sh
codex mcp add cerveau_fixelio --url https://memoire.fixelio.fr/mcp --bearer-token-env-var FIXELIO_BRAIN_TOKEN
```

3. Ajoutez la règle persistante ci-dessus, renseignez la clé localement, puis lancez `codex` depuis ce terminal. Dans les clients graphiques, utilisez un lancement qui transmet les variables ou leur stockage privé.
4. Vérifiez `/mcp`, puis demandez de vérifier `brain_context` et votre tenant. Invoquez au besoin `$cerveau-fixelio`.

Alternative stdio : exemple `examples/codex-stdio.toml`. Le pont vérifie également l’UUID attendu, ce que la seule configuration HTTP native ne fait pas automatiquement : dans ce dernier cas, la vérification revient à l’assistant via brain_context.

## 6. Claude Code

1. Copiez le même dossier `skills/cerveau-fixelio` dans `~/.claude/skills/` et ajoutez la règle à `~/.claude/CLAUDE.md`.
2. Ajoutez le serveur stdio, avec le chemin absolu du kit :

```sh
claude mcp add --transport stdio --scope user cerveau_fixelio -- node /CHEMIN_ABSOLU_DU_KIT/scripts/mcp-stdio.mjs
```

3. Lancez Claude Code depuis le terminal possédant les variables privées. Si votre politique de client filtre l’environnement, utilisez sa configuration de variables privées ; le pont échoue sans clé ou UUID attendu. Exemple de configuration de projet avec références de variables : `examples/mcp-stdio.json`.
4. Vérifiez `/mcp`, puis invoquez `/cerveau-fixelio`. Le champ platform sera `claude`, pas `codex`.

Alternative HTTP : `examples/claude-http.json` montre les références de variables admises dans `.mcp.json`. Ne remplacez pas la référence par votre clé en clair dans un dépôt.

## 7. Autres harness et autres tenants

- **MCP Streamable HTTP + Bearer pris en charge** : URL HTTPS ci-dessus et clé dans le stockage privé du client.
- **MCP stdio uniquement** : lancer le pont Node avec son chemin absolu et les variables privées. Aucun port local ni serveur HTTP local n’est ouvert.
- **Pas de MCP** : le skill seul ne suffit pas ; il faut un adaptateur de tools spécifique au harness. Ce kit ne prétend pas rendre compatible un client dépourvu d’outils.
- **Plusieurs tenants** : une clé et une entrée MCP par tenant, avec des noms distincts. L’utilisateur choisit le serveur ; aucune écriture parallèle dans tous les tenants par défaut. Configurez des variables distinctes et le tenant attendu pour chaque entrée. La mémoire privée d’un autre membre reste exclue.

Le serveur accepte des noms de harness stables (codex, chatgpt, claude, cursor, gemini-cli, opencode, custom-agent…), de 1 à 40 caractères minuscules/chiffres/tirets/underscores, commençant par une lettre. Cela permet de séparer les identifiants de conversation et les journaux. Cela ne remplace pas un test dans chaque application.

### ChatGPT web et clients cloud

Sur ChatGPT : Plugins → Ajouter un serveur MCP personnalisé → URL HTTPS ci-dessus → OAuth → enregistrement dynamique DCR → permissions choisies → connexion Authentik → sélectionner son tenant propriétaire → autoriser → installer le plugin obtenu. Utilisez les instructions persistantes du compte et le skill si la surface le permet. Le compte et les politiques du workspace doivent permettre ce raccordement.

L’OAuth du serveur est actuellement limité aux retours officiels ChatGPT. Ne lancez pas `codex mcp login` ou l’OAuth de Claude en pensant qu’ils fonctionnent déjà : pour ces clients, utilisez la clé de service et HTTP/stdio. Le support OAuth d’autres clients cloud nécessite d’enregistrer leurs callbacks exacts côté serveur ; il ne faut pas ouvrir un wildcard de redirection. La disponibilité mobile et l’appel automatique des outils doivent être vérifiés sur le produit concerné.

## 8. Vérification et révocation

Le diagnostic `scripts/check.mjs` vérifie le tenant attendu sans lire le coffre ni écrire dans la base. Contrôlez `private_writable_space: true` pour la continuité.

Dans votre IA, demandez ensuite : « Vérifie mon tenant avec brain_context et retrouve uniquement le contexte de [sujet]. » La réussite de l’installation peut être enregistrée par record_action dans votre espace privé. Les autres conversations n’ont pas besoin d’être réveillées.

Pour révoquer : site Fixelio Mémoire → bon tenant → Accès API & assistants → Révoquer la clé de cet appareil/service. Retirez aussi la configuration du client. Expiration ou révocation n’effacent pas les mémoires déjà enregistrées.

## Compatibilité réellement validée

Les tests du kit couvrent le refus HTTP/TLS désactivé, l’UUID attendu avant écriture, la non-divulgation des erreurs et les notifications MCP. Le serveur est testé pour les espaces de conversation séparés entre Codex, Claude, Gemini CLI et un harness personnalisé, la concurrence et l’isolation des données. Un test de protocole avec SDK MCP contrôle aussi le pont ; cela n’est pas une certification de toutes les versions de Claude, Cursor, Gemini ou des clients mobiles.

## Documentation officielle

- [Codex : MCP et configuration](https://learn.chatgpt.com/docs/extend/mcp)
- [Codex : skills](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code : MCP](https://code.claude.com/docs/en/mcp)
- [Claude Code : skills](https://code.claude.com/docs/en/skills)
- [ChatGPT : serveur MCP personnalisé](https://developers.openai.com/api/docs/guides/custom-mcp-server)
- [Standard MCP : transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)


## Continuité pendant une coupure

Avec un profil installé, les étapes record_action sont conservées dans une file locale AES-256-GCM avant envoi. La clé de chiffrement est dans le coffre du système, distincte de la valeur API. Les fichiers n’exposent pas le texte en clair ; la file est limitée à1000événements et10Mio. Les événements sont dédupliqués et supprimés localement seulement après confirmation explicite du serveur. Lors d’une reconnexion, cinq événements au plus sont repris pendant l’initialisation ou la vérification du contexte.

Une réponse `queued: true, synced: false` signifie **en attente locale**, jamais « synchronisé ». Les erreurs de droits, conflits et altérations restent à résoudre ; les événements ne sont pas supprimés silencieusement. La file ne rejoue **aucune opération externe**, aucune lecture de coffre, aucune fusion, ni une synthèse susceptible de conflit.

```sh
node /CHEMIN_DU_KIT/scripts/pending.mjs personnel status
node /CHEMIN_DU_KIT/scripts/pending.mjs personnel flush
```

Si le MCP n’a pas pu démarrer pendant la coupure, un harness disposant d’un terminal peut enregistrer uniquement une étape de journal via `pending.mjs personnel record`, avec les arguments record_action JSON sur stdin. L’IA doit annoncer l’attente locale. Aucun secret dans ces arguments. Les anciens clients par variables temporaires ne disposent pas de cette file persistante.

## Contexte court et recherche

Après brain_context, utiliser context_packet avec le sujet et un budget souhaité, plutôt que charger de grandes cartes historiques. Le serveur renvoie des extraits sourcés et bornés en volume ; le nombre de tokens reste une estimation indépendante du modèle. Lire une carte complète seulement si nécessaire. La recherche combine texte, sens et relations, selon l’état de l’index local.

## Export ouvert et privé

```sh
node /CHEMIN_DU_KIT/scripts/export.mjs personnel /DOSSIER_NOUVEAU_D_EXPORT
```

Le programme vérifie le tenant, puis exporte les mémoires autorisées en JSONL et en fichiers Markdown identifiés par UUID. Les relations, versions et provenances restent dans le JSONL. Un marqueur de fin permet de détecter un export interrompu ; des fichiers partiels ne sont jamais annoncés comme complets. Le coffre et les clés sont exclus. Les textes d’origine nécessitent une permission sources:read et peuvent être téléchargés depuis l’interface web.

Les fichiers exportés contiennent vos données privées : ne les commitez pas et ne les mettez pas dans ce dépôt public. Le JSONL conserve le contenu original ; les corps dans les Markdown sont présentés comme texte pour éviter l’interprétation de HTML ou d’images distantes provenant des mémoires.

## Utiliser un secret sans l’afficher

Le propriétaire peut configurer dans le site un service HTTPS, un secret autorisé et des méthodes/chemins exacts. L’IA utilise list_services puis operate_service pour une opération actuellement autorisée : le serveur injecte le secret et renvoie le résultat filtré. Ce n’est pas un proxy web général.

Si l’opération requiert effectivement la valeur, read_vault_secret reste disponible selon le droit coffre de la clé, avec purpose:authorized_operation. Afficher le mot de passe dans le chat exige la demande actuelle explicite de son propriétaire pour ce secret précis. Aucune valeur de secret dans les cartes, synthèses ou journaux.
