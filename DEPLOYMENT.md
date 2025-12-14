# Office Visits Analyzer - Deployment Guide

## 🚀 GitHub Pages Deployment

### Prerequisites
- GitHub account
- Git installed on your computer

### Step 1: Create GitHub Repository

```bash
cd "c:\Users\Musaddique Qazi\AntigravityProjects\office_visits"
git init
git add .
git commit -m "Initial commit: Office Visits Analyzer"
```

### Step 2: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `office-visits-analyzer`
3. Description: "Analyze Google Maps Timeline to track office visits"
4. **Make it Private** (for your data privacy)
5. Do NOT initialize with README
6. Click "Create repository"

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/office-visits-analyzer.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Your site will be live at: `https://YOUR_USERNAME.github.io/office-visits-analyzer/`

## 🔒 Data Privacy Features

### Your Data is 100% Private:
✅ **Stored locally** in your browser's IndexedDB
✅ **Never uploaded** to GitHub or any server
✅ **Persists across sessions** - upload once, use forever
✅ **Only you can access** your timeline data

### How It Works:
1. **First Time**: Upload your Timeline JSON file
2. **Data Saved**: Automatically stored in browser's IndexedDB
3. **Next Visits**: Data loads automatically - no re-upload needed!
4. **Update Data**: Upload a new file anytime to refresh

## 📊 Storage Information

The app stores:
- Timeline location data
- File name and upload date
- Record count and file size

**Storage Location**: Browser's IndexedDB (local only)
**Typical Size**: 5-50 MB depending on your timeline history

## 🔄 Updating Your Data

To refresh with new timeline data:
1. Download latest data from Google Takeout
2. Visit your deployed site
3. Click "Remove" on existing data
4. Upload new JSON file
5. Data automatically saved for future use

## 🛠️ Local Development

To run locally:
```bash
python -m http.server 8000
```
Then visit: http://localhost:8000/index.html

## 📝 Files in Repository

- `index.html` - Main application page
- `styles.css` - Styling and design
- `app.js` - Core application logic
- `storage.js` - IndexedDB data persistence
- `diagnostic.html` - Data format diagnostic tool
- `README.md` - Documentation

**Note**: No JSON files or personal data are included in the repository!

## 🔐 Security Best Practices

1. **Keep repository private** if you're concerned about code visibility
2. **Never commit** JSON timeline files
3. **Clear browser data** if using a shared computer
4. **Use HTTPS** - GitHub Pages provides this automatically

## 💡 Tips

- **Bookmark your deployed URL** for quick access
- **Data persists** even if you close the browser
- **Works offline** after initial load (PWA-ready)
- **Mobile friendly** - works on iPhone/Android browsers

## 🆘 Troubleshooting

**Data not loading?**
- Check browser console for errors
- Try clearing IndexedDB and re-uploading
- Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

**Can't see dropdown options?**
- This has been fixed in the latest version
- Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

**Duration showing as NaN?**
- Ensure your JSON file is from iPhone Timeline
- Check that it has `startTime` and `endTime` fields

## 📧 Support

For issues or questions, check the browser console (F12) for detailed error messages.
