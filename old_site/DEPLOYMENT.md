# 📚 Documentation - Déploiement Automatique

## 🎯 Vue d'ensemble

Ce projet est configuré avec un **système de déploiement automatique** qui met à jour le site web sur Namecheap à chaque modification du code.

**En résumé** : Vous modifiez le code → Vous poussez sur GitHub → Le site se met à jour automatiquement ! 🚀

---

## 🏗️ Architecture du Système

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Code Local     │ ───> │    GitHub       │ ───> │  Namecheap      │
│  (Cursor/VSCode)│ push │  (Repository)   │ auto │  (tom.better-   │
│                 │      │                 │ FTP  │   investor.co)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                               │
                               │ GitHub Actions
                               │ détecte le push
                               ▼
                    ┌──────────────────────┐
                    │  Déploiement Auto    │
                    │  - Se connecte FTP   │
                    │  - Upload fichiers   │
                    │  - Site mis à jour   │
                    └──────────────────────┘
```

---

## 🔧 Composants Techniques

### 1. Git & GitHub
- **Repository** : `goonidz/better-investor`
- **Branche principale** : `main`
- **URL** : https://github.com/goonidz/better-investor

### 2. GitHub Actions
- **Fichier de config** : `.github/workflows/deploy.yml`
- **Déclencheur** : Chaque push sur la branche `main`
- **Action** : Upload automatique via FTP

### 3. Namecheap Hosting
- **Domaine** : `tom.better-investor.co`
- **Dossier cible** : `/tom.better-investor.co/`
- **Protocole** : FTP

### 4. Secrets GitHub (Credentials)
Stockés de manière sécurisée dans GitHub :
- `FTP_SERVER` : `better-investor.co`
- `FTP_USERNAME` : `deploy@better-investor.co`
- `FTP_PASSWORD` : `+PW7j5n~99JE`

---

## 📋 Guide de Déploiement Initial (Setup)

### Prérequis
- Compte GitHub
- Hébergement Namecheap avec cPanel
- Git installé localement

### Étape 1 : Créer le Repository GitHub

1. Allez sur https://github.com/new
2. Nom du repository : `better-investor`
3. Visibilité : Public ou Private
4. **Ne cochez RIEN** (pas de README, .gitignore, etc.)
5. Cliquez sur **"Create repository"**

### Étape 2 : Créer un Compte FTP sur Namecheap

1. Connectez-vous à **cPanel** de Namecheap
2. Cherchez **"FTP Accounts"**
3. Cliquez sur **"Add FTP Account"**
4. Remplissez :
   - **Log In** : `deploy` (ou autre nom)
   - **Domain** : Sélectionnez votre domaine
   - **Password** : Utilisez le générateur de mot de passe
   - **Directory** : `/home/VOTRE_USERNAME/tom.better-investor.co`
   - **Quota** : Unlimited
5. Cliquez sur **"Create FTP Account"**
6. **⚠️ NOTEZ les informations :**
   - Username complet (ex: `deploy@better-investor.co`)
   - Password généré
   - Server (ex: `better-investor.co`)

### Étape 3 : Configurer les Secrets GitHub

1. Allez sur votre repository : `https://github.com/VOTRE_USERNAME/better-investor`
2. Cliquez sur **Settings** (⚙️)
3. Dans le menu gauche : **Secrets and variables** > **Actions**
4. Cliquez sur **"New repository secret"**
5. Ajoutez **3 secrets** un par un :

   **Secret 1 :**
   - Name : `FTP_SERVER`
   - Secret : `better-investor.co` (ou votre domaine)
   
   **Secret 2 :**
   - Name : `FTP_USERNAME`
   - Secret : `deploy@better-investor.co` (votre username FTP)
   
   **Secret 3 :**
   - Name : `FTP_PASSWORD`
   - Secret : Votre mot de passe FTP

### Étape 4 : Initialiser Git Localement

```bash
# Naviguez vers votre projet
cd /chemin/vers/better-investor

# Initialisez Git
git init

# Ajoutez tous les fichiers
git add .

# Créez le premier commit
git commit -m "Initial commit"

# Renommez la branche en main
git branch -M main

# Ajoutez le repository distant
git remote add origin https://github.com/VOTRE_USERNAME/better-investor.git

# Poussez le code
git push -u origin main
```

### Étape 5 : Vérification

1. Allez sur : https://github.com/VOTRE_USERNAME/better-investor/actions
2. Vous devriez voir un workflow en cours : **"Deploy to Namecheap"**
3. Attendez qu'il devienne vert ✅ (environ 1-2 minutes)
4. Visitez votre site : https://tom.better-investor.co
5. **✅ Votre site devrait être en ligne !**

---

## 🚀 Comment Déployer des Modifications

Une fois le setup initial terminé, déployer des modifications est **ultra simple** :

### Méthode Standard (Recommandée)

```bash
# 1. Modifiez vos fichiers (HTML, CSS, JS, etc.)

# 2. Ajoutez les fichiers modifiés
git add .

# 3. Créez un commit avec un message descriptif
git commit -m "Description de vos modifications"

# 4. Poussez sur GitHub
git push

# ✅ C'EST TOUT ! Le site se met à jour automatiquement en 1-2 minutes
```

### Exemple Pratique

```bash
# Scénario : Vous avez modifié index.html

git add index.html
git commit -m "Update homepage title and add new section"
git push

# GitHub Actions détecte le push
# Les fichiers sont uploadés automatiquement via FTP
# tom.better-investor.co est mis à jour !
```

### Workflow Typique

```
1. Modifier le code localement
   ↓
2. Tester localement (ouvrir index.html dans le navigateur)
   ↓
3. git add . && git commit -m "Message"
   ↓
4. git push
   ↓
5. ⏱️ Attendre 1-2 minutes
   ↓
6. ✅ Vérifier sur tom.better-investor.co
```

---

## 📁 Structure du Projet

```
better-investor/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Configuration du déploiement automatique
├── .gitignore                  # Fichiers à ignorer par Git
├── index.html                  # Page d'accueil
├── simulator.html              # Page simulateur
├── README.md                   # Documentation principale
└── DEPLOYMENT.md               # Ce fichier
```

---

## 🔍 Détails Techniques : Le Fichier deploy.yml

Le fichier `.github/workflows/deploy.yml` contient la configuration de GitHub Actions :

```yaml
name: Deploy to Namecheap

on:
  push:
    branches:
      - main  # Se déclenche à chaque push sur main

jobs:
  deploy:
    runs-on: ubuntu-latest  # Utilise une machine Ubuntu
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3  # Récupère le code
    
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.3.3  # Action FTP
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        server-dir: /tom.better-investor.co/  # Dossier de destination
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          .github/**
          README.md
```

### Ce qui se passe automatiquement :

1. **Déclencheur** : Détecte un `git push` sur `main`
2. **Checkout** : GitHub récupère votre code
3. **Connexion FTP** : Se connecte à Namecheap avec vos identifiants
4. **Upload** : Télécharge tous les fichiers (sauf ceux exclus)
5. **Mise à jour** : Le site est instantanément mis à jour
6. **Notification** : Vous recevez un email si ça échoue

---

## 🔐 Sécurité

### Pourquoi utiliser GitHub Secrets ?

- ❌ **JAMAIS** mettre les mots de passe dans le code
- ✅ Les secrets sont chiffrés par GitHub
- ✅ Invisible dans les logs publics
- ✅ Seul GitHub Actions peut y accéder

### Bonnes Pratiques

1. **Ne commitez JAMAIS** :
   - Mots de passe
   - Clés API
   - Informations sensibles

2. **Utilisez toujours** GitHub Secrets pour :
   - Identifiants FTP
   - Tokens d'API
   - Variables d'environnement sensibles

3. **Le fichier `.gitignore`** :
   - Empêche d'ajouter accidentellement des fichiers sensibles
   - Déjà configuré pour `.env`, `node_modules`, etc.

---

## 🐛 Troubleshooting (Résolution de Problèmes)

### Le déploiement échoue ❌

**1. Vérifier les logs GitHub Actions**
- Allez sur : https://github.com/goonidz/better-investor/actions
- Cliquez sur le workflow qui a échoué
- Lisez les logs pour identifier l'erreur

**2. Erreurs FTP courantes**

| Erreur | Cause Probable | Solution |
|--------|---------------|----------|
| `Connection refused` | Serveur FTP incorrect | Vérifiez `FTP_SERVER` dans les secrets |
| `Login incorrect` | Username/password invalide | Vérifiez `FTP_USERNAME` et `FTP_PASSWORD` |
| `Permission denied` | Dossier cible n'existe pas | Vérifiez le `server-dir` dans deploy.yml |
| `Timeout` | Firewall ou connexion lente | Réessayez plus tard |

**3. Re-configurer les secrets**

Si les identifiants ont changé :
1. Allez dans Settings > Secrets > Actions
2. Cliquez sur le secret à modifier
3. Cliquez sur "Update" et entrez la nouvelle valeur

### Le site ne se met pas à jour 🤔

**Vérifiez ces points :**

1. ✅ Le workflow GitHub Actions a réussi (pastille verte)
2. ✅ Le cache du navigateur : Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
3. ✅ Le bon dossier est ciblé dans `deploy.yml`
4. ✅ Les fichiers sont bien dans le repository

**Forcer le rafraîchissement :**

```bash
# Si vous voulez forcer un re-déploiement
git commit --allow-empty -m "Force redeploy"
git push
```

### Erreur Git locale 💻

**"Nothing to commit"**
```bash
# Normal si aucun fichier n'a été modifié
# Modifiez d'abord un fichier, puis recommencez
```

**"Permission denied"**
```bash
# Vérifiez votre connexion GitHub
# Vous devrez peut-être configurer SSH ou un token
```

**"Untracked files"**
```bash
# Des fichiers ne sont pas suivis par Git
git add .  # Ajoute tous les fichiers
git commit -m "Add new files"
```

---

## 📊 Suivre les Déploiements

### Voir l'historique des déploiements

1. Allez sur : https://github.com/goonidz/better-investor/actions
2. Vous verrez tous les déploiements :
   - ✅ Vert = Succès
   - ❌ Rouge = Échec
   - 🟡 Jaune = En cours

### Badges de statut (Optionnel)

Vous pouvez ajouter un badge dans votre README.md :

```markdown
![Deploy Status](https://github.com/goonidz/better-investor/actions/workflows/deploy.yml/badge.svg)
```

Ça affichera : ![Deploy Status](https://github.com/goonidz/better-investor/actions/workflows/deploy.yml/badge.svg)

---

## 🎓 Comprendre CI/CD

### Qu'est-ce que CI/CD ?

**CI (Continuous Integration)** = Intégration Continue
- Merge automatique du code
- Tests automatiques (si configurés)

**CD (Continuous Deployment)** = Déploiement Continu
- Déploiement automatique en production
- C'est ce que nous avons configuré ! ✅

### Avantages pour notre projet

✅ **Gain de temps** : Plus besoin d'upload manuel
✅ **Moins d'erreurs** : Processus automatisé et reproductible
✅ **Traçabilité** : Historique complet dans GitHub
✅ **Rapidité** : Mises à jour en 1-2 minutes
✅ **Fiabilité** : Toujours le même processus

### Utilisé par les Géants

- 🟦 **Facebook** : Déploie des centaines de fois par jour
- 🔴 **Netflix** : Déploiement continu en production
- 🟢 **Amazon** : Déploie toutes les 11.6 secondes
- 🔵 **Google** : Milliers de déploiements par jour

**Vous utilisez maintenant les mêmes outils que les GAFAM !** 🚀

---

## 💡 Astuces & Bonnes Pratiques

### 1. Commits Significatifs

❌ **Mauvais :**
```bash
git commit -m "update"
git commit -m "fix"
git commit -m "changes"
```

✅ **Bon :**
```bash
git commit -m "Add contact form to homepage"
git commit -m "Fix mobile responsiveness on simulator page"
git commit -m "Update hero section with new images"
```

### 2. Commiter Fréquemment

- Commitez après chaque fonctionnalité terminée
- Petit commit > Gros commit
- Plus facile de revenir en arrière si besoin

### 3. Tester Localement Avant de Pousser

```bash
# Ouvrez index.html dans votre navigateur
# Vérifiez que tout fonctionne
# Puis seulement après :
git add .
git commit -m "..."
git push
```

### 4. Utiliser des Branches (Avancé)

Pour de grosses modifications :

```bash
# Créez une branche de développement
git checkout -b feature/nouvelle-fonctionnalite

# Travaillez dessus
git add .
git commit -m "Add new feature"

# Poussez la branche
git push -u origin feature/nouvelle-fonctionnalite

# Créez une Pull Request sur GitHub
# Mergez dans main quand c'est prêt
```

---

## 🌐 Configuration Multi-Sites

### Déployer sur plusieurs domaines/sous-domaines

Si vous voulez déployer sur plusieurs sites :

1. **Option A : Plusieurs Workflows**
   - Créez `.github/workflows/deploy-prod.yml`
   - Créez `.github/workflows/deploy-staging.yml`
   - Configurez différents `FTP_SERVER` pour chaque

2. **Option B : Branches différentes**
   - Branche `main` → Production
   - Branche `staging` → Site de test
   - Configurez le déclencheur dans deploy.yml

---

## 🔥 GUIDE SPÉCIFIQUE NAMECHEAP (IMPORTANT !)

### ⚠️ Problèmes Courants et Solutions

Ce guide documente tous les problèmes rencontrés lors de la configuration du déploiement automatique sur Namecheap.

#### 1. **SSH/SFTP Ne Fonctionne Pas (Port 22 Timeout)**

**Symptôme :** `ssh: connect to host *** port 22: Operation timed out`

**Cause :** La plupart des hébergements partagés Namecheap **bloquent SSH depuis l'extérieur** (GitHub Actions ne peut pas se connecter).

**Solution :** Utilisez **FTPS** (FTP sécurisé sur port 21) au lieu de SFTP/SSH.

#### 2. **FTP Timeout ou "ENOTFOUND"**

**Symptôme :** `Error: getaddrinfo ENOTFOUND ***` ou `Connection timed out`

**Causes Possibles :**

a) **Hostname incorrect dans le secret `FTP_SERVER`**
   - ❌ NE PAS utiliser : `ftp://better-investor.co` (pas de protocole)
   - ❌ NE PAS utiliser : `ftp.votredomaine.com` (n'existe souvent pas sur hébergement partagé)
   - ✅ UTILISER : `votredomaine.com` (domaine principal sans préfixe)
   - ✅ OU : `sous-domaine.votredomaine.com` (le sous-domaine directement)
   - ✅ OU : `162.0.212.5` (adresse IP du serveur - à trouver dans cPanel)

b) **Compte FTP mal configuré**
   - Le compte FTP doit pointer vers le **bon sous-domaine/dossier**
   - Vérifiez le "Directory" dans cPanel > FTP Accounts

#### 3. **Configuration FTP pour Sous-Domaine**

**⚠️ TRÈS IMPORTANT** : Si vous déployez sur un sous-domaine (ex: `tom.votredomaine.com`), vous devez créer un compte FTP spécifique :

**Étapes dans cPanel > FTP Accounts :**

1. Cliquez **"Add FTP Account"**
2. **Log In** : `deploy` (ou autre nom)
3. **Domain** : Sélectionnez le sous-domaine (ex: `tom.better-investor.co`)
4. **Directory** : `/home/USERNAME/tom.better-investor.co/` (chemin du sous-domaine)
   - ❌ NE PAS utiliser `/public_html/` si c'est un sous-domaine
   - ✅ Utilisez le chemin spécifique au sous-domaine
5. **Password** : Générez un mot de passe fort
6. Cliquez **"Create FTP Account"**

Le username final sera : `deploy@tom.better-investor.co`

**Dans GitHub Secrets :**

```
FTP_SERVER = tom.better-investor.co (le sous-domaine, SANS ftp://)
FTP_USERNAME = deploy@tom.better-investor.co (avec le sous-domaine)
FTP_PASSWORD = votre_mot_de_passe_ftp
```

**Dans deploy.yml :**

```yaml
server-dir: /deploy/ 
# Ou le dossier relatif configuré dans le compte FTP
```

### ✅ Configuration Qui Fonctionne pour Namecheap

**Secrets GitHub à créer (EXACTEMENT comme ça) :**

| Nom du Secret | Valeur | ⚠️ ATTENTION |
|---------------|--------|-------------|
| `FTP_SERVER` | `sous-domaine.votredomaine.com` | SANS `ftp://`, SANS `https://`, juste le hostname |
| `FTP_USERNAME` | `deploy@sous-domaine.votredomaine.com` | Username complet du compte FTP |
| `FTP_PASSWORD` | `votre_mot_de_passe_ftp` | Le mot de passe généré dans cPanel |

**Workflow deploy.yml fonctionnel :**

```yaml
- name: Deploy via FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.3
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    port: 21                    # Port FTP standard
    protocol: ftps              # ⚠️ FTPS (sécurisé), PAS ftp ou sftp
    server-dir: /deploy/        # Dossier relatif dans le compte FTP
    timeout: 300000             # 5 minutes de timeout
    log-level: verbose          # Logs détaillés pour debug
    exclude: |
      **/.git*
      **/.git*/**
      **/node_modules/**
      .github/**
      README.md
      DEPLOYMENT.md
      QUICK_START.md
```

### 🧪 Tester la Connexion FTP Localement

**Avant de configurer GitHub Actions**, testez depuis votre Mac pour éviter de perdre du temps :

```bash
# Test avec curl (déjà installé sur Mac)
curl -v ftp://votredomaine.com --user deploy@sous-domaine.votredomaine.com:MOT_DE_PASSE

# Ce que vous devez voir :
# ✅ "220" ou "230 Login successful" = FTP fonctionne !
# ❌ "Connection timed out" = Port 21 bloqué (problème réseau/FAI)
# ❌ "530 Login incorrect" = Mauvais username ou password
```

**Si curl timeout aussi depuis votre Mac :**
- Votre FAI bloque peut-être le port 21
- Essayez depuis un hotspot téléphone
- Vérifiez que le compte FTP est bien actif dans cPanel

### 📋 Checklist Avant de Pousser sur GitHub

Vérifiez TOUT avant de lancer le déploiement :

- [ ] Compte FTP créé dans cPanel pour le bon domaine/sous-domaine
- [ ] Directory du compte FTP pointe vers le dossier correct du sous-domaine
- [ ] Secret `FTP_SERVER` ne contient **PAS** `ftp://`, `https://` ou autre protocole
- [ ] Secret `FTP_SERVER` = hostname/domaine/IP **UNIQUEMENT**
- [ ] Secret `FTP_USERNAME` correspond exactement au compte créé (avec @domaine)
- [ ] Secret `FTP_PASSWORD` est correct
- [ ] Connexion FTP testée localement avec curl (recommandé)
- [ ] Protocol dans deploy.yml est `ftps` (pas `ftp` ou `sftp`)
- [ ] Port dans deploy.yml est `21` (pas `22`)
- [ ] `server-dir` correspond au dossier dans le compte FTP

### 🚫 Ce Qui NE Fonctionne PAS sur Namecheap Shared Hosting

- ❌ SSH/SFTP depuis GitHub Actions (port 22 bloqué par Namecheap)
- ❌ FTP standard non sécurisé (utilisez FTPS avec `protocol: ftps`)
- ❌ Hostname `ftp.votredomaine.com` (DNS n'existe souvent pas)
- ❌ Protocole dans le secret (`ftp://...` ou `https://...`)
- ❌ Déploiement direct vers `/public_html/` si vous utilisez un sous-domaine
- ❌ Utiliser le compte FTP du domaine principal pour un sous-domaine

### ✅ Ce Qui Fonctionne

- ✅ FTPS (FTP sécurisé) sur port 21 avec `protocol: ftps`
- ✅ Compte FTP dédié créé spécifiquement pour le sous-domaine
- ✅ Hostname = domaine ou sous-domaine (sans préfixe, sans protocole)
- ✅ Directory du compte FTP pointant vers le bon dossier
- ✅ Timeout augmenté (300000ms = 5 minutes)
- ✅ Logs verbose pour faciliter le debug

### 🔍 Trouver les Bonnes Informations dans cPanel

#### 1. Trouver l'adresse IP du serveur :
- Connectez-vous à cPanel
- Tapez **"Server Information"** dans la barre de recherche
- Notez **"Shared IP Address"** (ex: `162.0.212.5`)
- Vous pouvez utiliser cette IP comme `FTP_SERVER` si le hostname ne fonctionne pas

#### 2. Vérifier/Créer un compte FTP :
- cPanel > **"FTP Accounts"**
- Si vous avez déjà un compte : vérifiez le **"Path"** ou **"Directory"**
- Si non : cliquez **"Add FTP Account"**
- **IMPORTANT** : Le Directory doit pointer vers le dossier de votre sous-domaine

#### 3. Tester le compte FTP :
- Dans la liste FTP Accounts, vous verrez :
  - **Log In** : `deploy@tom.better-investor.co`
  - **Path** : `/home/bettzsnt/tom.better-investor.co/deploy`
  - **FTP server** : `ftp.better-investor.co` (mais utilisez juste le domaine sans ftp)

#### 4. Trouver le bon hostname :
- **Option 1** : Utilisez le sous-domaine : `tom.better-investor.co` ✅
- **Option 2** : Utilisez le domaine principal : `better-investor.co` ✅
- **Option 3** : Utilisez l'IP : `162.0.212.5` ✅
- **Ne pas utiliser** : `ftp.better-investor.co` (n'existe souvent pas) ❌

### 💡 Temps de Déploiement Attendu

Une fois configuré correctement :
- **Connexion FTP** : 2-3 secondes
- **Upload des fichiers** : 5-10 secondes (dépend de la taille)
- **Total** : 10-15 secondes
- **Disponibilité** : Instantanée après l'upload

Si le déploiement prend plus de 30 secondes ou timeout :
- Vérifiez les secrets GitHub
- Vérifiez que le compte FTP est actif
- Testez la connexion localement avec curl

### 🐛 Debugging : Erreurs Communes

#### Erreur : `getaddrinfo ENOTFOUND ***`
**Cause** : Le hostname dans `FTP_SERVER` n'existe pas ou contient un protocole

**Solution** :
1. Enlevez `ftp://` ou `https://` du secret
2. Essayez le domaine sans `ftp.` devant
3. Essayez l'IP du serveur

#### Erreur : `Connection timed out`
**Cause** : Port 21 bloqué ou hostname incorrect

**Solution** :
1. Testez depuis votre Mac avec curl
2. Si curl marche mais pas GitHub : vérifiez le hostname dans le secret
3. Essayez l'IP au lieu du hostname

#### Erreur : `530 Login incorrect`
**Cause** : Username ou password incorrect

**Solution** :
1. Vérifiez que `FTP_USERNAME` est le username COMPLET (avec @domaine)
2. Vérifiez le password dans cPanel
3. Recréez le compte FTP si nécessaire

#### Erreur : `Could not change to directory`
**Cause** : Le `server-dir` n'existe pas ou le compte FTP n'y a pas accès

**Solution** :
1. Vérifiez le Directory du compte FTP dans cPanel
2. Ajustez `server-dir` dans deploy.yml pour correspondre
3. Souvent `/deploy/` ou `/` fonctionne

### 📝 Exemple de Configuration Complète (Ce Qui a Fonctionné)

**Pour le projet better-investor :**

**Compte FTP dans cPanel :**
- Username : `deploy@tom.better-investor.co`
- Directory : `/home/bettzsnt/tom.better-investor.co/deploy`
- Password : (généré dans cPanel)

**Secrets GitHub :**
```
FTP_SERVER = tom.better-investor.co
FTP_USERNAME = deploy@tom.better-investor.co
FTP_PASSWORD = (le mot de passe généré)
```

**deploy.yml :**
```yaml
protocol: ftps
port: 21
server-dir: /deploy/
timeout: 300000
```

**Résultat :** ✅ Déploiement en 11 secondes !

---

## 📞 Support & Ressources

### Documentation Officielle

- **GitHub Actions** : https://docs.github.com/en/actions
- **FTP Deploy Action** : https://github.com/SamKirkland/FTP-Deploy-Action
- **Git** : https://git-scm.com/doc

### En Cas de Problème

1. Vérifiez les logs GitHub Actions
2. Consultez cette documentation
3. Vérifiez la connexion FTP dans cPanel
4. Testez la connexion FTP manuellement (FileZilla)

### Contact

- **GitHub Issues** : https://github.com/goonidz/better-investor/issues
- **Email** : support@better-investor.co

---

## 📝 Changelog

### Version 1.0 (Janvier 2026)
- ✅ Configuration initiale du déploiement automatique
- ✅ Setup GitHub Actions + FTP
- ✅ Déploiement vers tom.better-investor.co
- ✅ Documentation complète

---

## ✅ Checklist de Vérification

Avant de considérer que tout fonctionne, vérifiez :

- [ ] Repository GitHub créé
- [ ] Compte FTP Namecheap configuré
- [ ] Les 3 secrets GitHub ajoutés (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`)
- [ ] Fichier `.github/workflows/deploy.yml` présent
- [ ] Premier push effectué avec succès
- [ ] Workflow GitHub Actions en vert ✅
- [ ] Site accessible sur tom.better-investor.co
- [ ] Test de modification → push → vérification automatique réussie

---

## 🎉 Conclusion

Vous avez maintenant un système de déploiement professionnel ! 

**Workflow final :**
1. 🖊️ Modifiez le code
2. 💾 `git add . && git commit -m "Message"`
3. 🚀 `git push`
4. ⏱️ Attendez 1-2 minutes
5. ✅ Le site est à jour !

**Bienvenue dans le monde du DevOps moderne !** 🚀

---

*Document créé le 12 janvier 2026*  
*Projet : Better Investor*  
*Auteur : Tom - Lazy Investor*
