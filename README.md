# 📍 Office Visits Analyzer

A privacy-focused web application to analyze your Google Maps Timeline data and track office visits by month.

## ✨ Features

- 🔒 **100% Private** - All data processed locally in your browser
- 💾 **Persistent Storage** - Upload once, data saved in browser's IndexedDB
- 📊 **Detailed Analytics** - Track visits, duration, start/end times
- 📅 **Monthly Reports** - Analyze any month from your timeline history
- 📍 **Address Search** - Find office coordinates by address
- 📤 **CSV Export** - Download results for further analysis
- 📱 **iPhone & Android** - Supports both Timeline formats

## 🚀 Live Demo

Visit: [Your GitHub Pages URL]

## 🔐 Privacy & Security

- ✅ No data uploaded to any server
- ✅ All processing happens in your browser
- ✅ Data stored locally in IndexedDB
- ✅ No tracking or analytics
- ✅ Open source - verify the code yourself

## 📖 How to Use

### 1. Get Your Timeline Data
1. Visit [Google Takeout](https://takeout.google.com/)
2. Select "Location History" or "Timeline"
3. Download in JSON format
4. Extract the JSON file

### 2. Upload & Analyze
1. Open the app
2. Upload your Timeline JSON file (saved automatically)
3. Enter your office address or coordinates
4. Select month and year
5. Click "Analyze Visits"

### 3. View Results
- Total office visits
- Unique days visited
- Average duration per visit
- Start and end times for each visit
- Export to CSV

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Storage**: IndexedDB API
- **Geocoding**: OpenStreetMap Nominatim API
- **Hosting**: GitHub Pages

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/office-visits-analyzer.git
cd office-visits-analyzer

# Start local server
python -m http.server 8000

# Open in browser
http://localhost:8000/index.html
```

## 📊 Supported Data Formats

- iPhone Timeline (Semantic Location History)
- Android Timeline (Records.json)
- Legacy Location History
- Direct location arrays

## 🔄 Updating Your Data

To refresh with new timeline data:
1. Click "Remove" on existing data
2. Upload new JSON file
3. Data automatically saved for future sessions

## 📝 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This tool is for personal use only. Ensure you comply with Google's Terms of Service when downloading and using your Timeline data.

---

Made with ❤️ for privacy-conscious office visit tracking
