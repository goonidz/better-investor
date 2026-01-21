# ⚡ Guide Rapide - Better Investor

Guide ultra-rapide pour déployer vos modifications.

## 🚀 Déployer en 3 Commandes

```bash
git add .
git commit -m "Description de vos modifications"
git push
```

**✅ C'est tout ! Le site se met à jour automatiquement en 1-2 minutes.**

---

## 📋 Commandes Essentielles

### Déployer des Modifications

```bash
# Workflow complet
git add .                              # Ajouter tous les fichiers modifiés
git commit -m "Update homepage hero"   # Créer un commit
git push                               # Pousser sur GitHub → Déploiement auto
```

### Déployer un Fichier Spécifique

```bash
git add index.html
git commit -m "Fix typo in homepage"
git push
```

### Voir le Statut

```bash
git status          # Voir les fichiers modifiés
git log --oneline   # Voir l'historique des commits
```

### Annuler des Modifications (avant commit)

```bash
git restore index.html      # Annuler les modifs d'un fichier
git restore .               # Annuler toutes les modifs
```

---

## 🔗 Liens Rapides

| Resource | URL |
|----------|-----|
| **Site en production** | https://tom.better-investor.co |
| **Repository GitHub** | https://github.com/goonidz/better-investor |
| **Déploiements (Actions)** | https://github.com/goonidz/better-investor/actions |
| **Secrets GitHub** | https://github.com/goonidz/better-investor/settings/secrets/actions |
| **cPanel Namecheap** | https://cpanel.namecheap.com |

---

## ✅ Checklist Avant de Push

- [ ] Testé localement (ouvrir index.html dans le navigateur)
- [ ] Code fonctionne correctement
- [ ] Message de commit clair et descriptif
- [ ] Aucun mot de passe ou clé API dans le code

---

## 🐛 Problème ?

### Le déploiement échoue
1. Vérifiez : https://github.com/goonidz/better-investor/actions
2. Cliquez sur le workflow rouge pour voir les logs
3. Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) section Troubleshooting

### Le site ne se met pas à jour
1. Vérifiez que le workflow est vert ✅
2. Videz le cache du navigateur : `Ctrl+F5` (Windows) ou `Cmd+Shift+R` (Mac)
3. Attendez 2-3 minutes

### Forcer un re-déploiement
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide complet de déploiement
- **[README.md](./README.md)** - Vue d'ensemble du projet

---

## 💡 Tips

### Commits Efficaces

✅ **Bon** : `git commit -m "Add pricing section to homepage"`  
❌ **Mauvais** : `git commit -m "update"`

### Workflow Quotidien

```bash
# Matin : Récupérer les dernières modifications
git pull

# Pendant la journée : Commiter régulièrement
git add .
git commit -m "Add feature X"

# Soir : Pousser tout
git push
```

### Voir les Fichiers Modifiés

```bash
git diff              # Voir les modifications en détail
git diff index.html   # Voir les modifs d'un fichier spécifique
```

---

## ⚙️ Infos Techniques Rapides

- **Branch principale** : `main`
- **Dossier de déploiement** : `/tom.better-investor.co/`
- **Temps de déploiement** : ~1-2 minutes
- **Déclencheur** : Push sur `main`

---

## 🎯 Objectif

**Modification → Push → Site à jour en 2 minutes !** 🚀

*Document créé le 12 janvier 2026*
