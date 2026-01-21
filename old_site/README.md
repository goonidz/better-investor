# 🚀 Better Investor

Site web professionnel avec déploiement automatique.

## 📋 À Propos

Better Investor est un outil de planification financière et de retraite développé par **Tom - Lazy Investor**.

- **Site en production** : https://tom.better-investor.co
- **Repository** : https://github.com/goonidz/better-investor
- **Statut du déploiement** : ![Deploy Status](https://github.com/goonidz/better-investor/actions/workflows/deploy.yml/badge.svg)

## ✨ Fonctionnalités

- 📊 **Retirement Planner** - Calculateur de retraite avec projections
- 📈 **Investment Simulator** - Simulateur d'investissements
- 🎨 **Design Moderne** - Interface élégante avec Tailwind CSS
- 🚀 **Déploiement Automatique** - Mise à jour instantanée via GitHub Actions

## 🔧 Technologies

- **Frontend** : HTML5, Tailwind CSS, Chart.js
- **Hébergement** : Namecheap
- **CI/CD** : GitHub Actions + FTP Deploy
- **Version Control** : Git + GitHub

## 🚀 Déploiement

Ce projet utilise un système de **déploiement automatique** :

```
Code Local → GitHub → Namecheap (automatique)
```

### Quick Start

```bash
# Modifier le code
git add .
git commit -m "Description des modifications"
git push

# ✅ Le site se met à jour automatiquement en 1-2 minutes !
```

### 📚 Documentation Complète

Pour le setup complet, la configuration et le troubleshooting, consultez :

**👉 [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide Complet de Déploiement**

Ce guide couvre :
- 🏗️ Architecture du système
- 📋 Setup initial étape par étape
- 🚀 Comment déployer des modifications
- 🔐 Configuration des secrets
- 🐛 Résolution de problèmes
- 💡 Bonnes pratiques Git

## 🏃 Développement Local

```bash
# Cloner le repository
git clone https://github.com/goonidz/better-investor.git
cd better-investor

# Ouvrir dans le navigateur
open index.html  # macOS
# ou
start index.html  # Windows
```

Pas de build requis ! Pure HTML/CSS/JS.

## 📁 Structure du Projet

```
better-investor/
├── .github/workflows/
│   └── deploy.yml          # Configuration CI/CD
├── index.html              # Page principale (Retirement Planner)
├── simulator.html          # Simulateur d'investissement
├── README.md               # Ce fichier
└── DEPLOYMENT.md           # Documentation déploiement complète
```

## 🔄 Workflow de Contribution

1. **Développer localement** : Testez vos modifications
2. **Commit** : `git commit -m "Description claire"`
3. **Push** : `git push origin main`
4. **Automatique** : GitHub Actions déploie sur Namecheap
5. **Vérifier** : Consultez https://tom.better-investor.co

## 📊 Suivi des Déploiements

Consultez l'historique des déploiements :  
👉 https://github.com/goonidz/better-investor/actions

- ✅ **Vert** = Déploiement réussi
- ❌ **Rouge** = Échec (voir les logs)
- 🟡 **Jaune** = En cours

## 🐛 Problèmes ?

1. Vérifiez les [logs GitHub Actions](https://github.com/goonidz/better-investor/actions)
2. Consultez le [Guide de Déploiement](./DEPLOYMENT.md)
3. Ouvrez une [Issue](https://github.com/goonidz/better-investor/issues)

## 📞 Contact

- **Créateur** : Tom - Lazy Investor
- **Email** : support@better-investor.co
- **Site** : https://better-investor.co

## 📄 Licence

© 2026 Tom - Lazy Investor. Tous droits réservés.

---

**Made with ❤️ by Tom** | Automated with GitHub Actions 🤖
