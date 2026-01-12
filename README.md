# Better Investor

Site web pour Better Investor.

## Déploiement automatique

Ce projet est configuré pour se déployer automatiquement sur Namecheap à chaque push sur la branche `main`.

## Configuration initiale

### 1. Créer le dépôt GitHub

1. Allez sur https://github.com/new
2. Créez un nouveau dépôt (public ou privé)
3. Ne pas initialiser avec README, .gitignore ou license (on les a déjà)

### 2. Configurer les secrets GitHub

Pour le déploiement automatique, ajoutez ces secrets dans votre dépôt GitHub :

1. Allez dans Settings > Secrets and variables > Actions
2. Ajoutez ces secrets :
   - `FTP_SERVER` : Votre serveur FTP Namecheap (ex: ftp.votredomaine.com)
   - `FTP_USERNAME` : Votre nom d'utilisateur FTP
   - `FTP_PASSWORD` : Votre mot de passe FTP

### 3. Trouver vos informations FTP Namecheap

1. Connectez-vous à votre compte Namecheap
2. Allez dans cPanel
3. Cherchez "FTP Accounts" ou "Comptes FTP"
4. Vous y trouverez :
   - Server: généralement `ftp.votredomaine.com` ou `votredomaine.com`
   - Username: votre nom d'utilisateur
   - Créez un mot de passe si nécessaire

### 4. Pousser le code

```bash
# Initialiser Git
git init
git add .
git commit -m "Initial commit"

# Ajouter le dépôt distant (remplacez USERNAME et REPO)
git remote add origin https://github.com/USERNAME/REPO.git

# Pousser le code
git branch -M main
git push -u origin main
```

## Comment ça marche ?

Une fois configuré :
1. Vous (ou l'IA) faites des modifications
2. Vous poussez sur GitHub
3. GitHub Actions détecte le push
4. Le code est automatiquement uploadé sur Namecheap via FTP
5. Le site est mis à jour automatiquement !

## Développement local

Ouvrez simplement `index.html` dans votre navigateur pour tester localement.
