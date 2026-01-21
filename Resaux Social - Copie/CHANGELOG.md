# Historique des Modifications - GutChat

## Initialisation
- [x] Initialisation du projet npm.
- [x] Installation des dépendances : `express`, `sqlite3`, `body-parser`, `multer`.
- [x] Création de `server.js` avec configuration Express de base.
- [x] Configuration de la base de données SQLite (Tables: Users, Posts, Messages).

## Backend
- [x] Ajout des routes d'API pour l'Inscription (`/api/register`) et la Connexion (`/api/login`).
- [x] Ajout des routes pour créer et lire les Posts (`/api/posts`).
- [x] Ajout des routes de Messagerie Privée (`/api/messages`, `/api/users`).

## Frontend
- [x] Création de `index.html` avec structure SPA (Connexion, Fil, Profil).
- [x] Ajout de la section "Messages" dans le HTML.
- [x] Ajout de `styles.css` avec design responsive et moderne (police Inter).
- [x] Styles spécifiques pour la messagerie (bulles de chat, liste d'amis).
- [x] Implémentation de `script.js` :
    - Gestion de l'inscription et connexion via AJAX.
    - Affichage dynamique des posts.
    - Gestion de la session utilisateur (localStorage).
    - Logique complète de messagerie (chargement utilisateurs, envoi/réception temps réel via requêtes).
    
## Vérification
- [x] Installation des dépendances réussie après correction du PATH npm.
