// Google Maps Timeline Analyzer - iPhone Compatible with IndexedDB Storage
class TimelineAnalyzer {
    constructor() {
        this.timelineData = null;
        this.officeLocation = null;
        this.radius = 100;
        this.selectedMonth = null;
        this.selectedYear = null;
        this.isAuthenticated = false;
        this.storage = new TimelineStorage();

        this.initializeElements();
        this.attachEventListeners();
        this.initGoogleAuth();
        this.loadStoredData(); // Auto-load data from IndexedDB
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.removeFileBtn = document.getElementById('remove-file');

        // Office location elements
        this.officeAddressInput = document.getElementById('office-address');
        this.searchAddressBtn = document.getElementById('search-address-btn');
        this.addressStatus = document.getElementById('address-status');
        this.officeNameInput = document.getElementById('office-name');
        this.officeLatInput = document.getElementById('office-lat');
        this.officeLngInput = document.getElementById('office-lng');
        this.radiusInput = document.getElementById('radius');

        // Month selection elements
        this.monthSelect = document.getElementById('month-select');
        this.yearSelect = document.getElementById('year-select');
        this.analyzeBtn = document.getElementById('analyze-btn');

        // Results elements
        this.resultsSection = document.getElementById('results-section');
        this.totalVisitsEl = document.getElementById('total-visits');
        this.uniqueDaysEl = document.getElementById('unique-days');
        this.avgDurationEl = document.getElementById('avg-duration');
        this.visitsListEl = document.getElementById('visits-list');
        this.exportBtn = document.getElementById('export-btn');

        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');

        this.populateMonthSelect();
    }

    initGoogleAuth() {
        const uploadSection = document.getElementById('upload-section');
        const cardBody = uploadSection.querySelector('.card-body');

        const googleSignInHTML = `
            <div class="google-signin-container">
                <button class="btn-google" id="google-signin-btn">
                    <svg class="google-icon" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google to Access Timeline
                </button>
                <div class="divider">
                    <span>OR</span>
                </div>
            </div>
        `;

        cardBody.insertAdjacentHTML('afterbegin', googleSignInHTML);

        const googleSignInBtn = document.getElementById('google-signin-btn');
        googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
    }

    async handleGoogleSignIn() {
        const message = `
            <div style="text-align: left;">
                <p style="margin-bottom: 1rem;"><strong>Important Note:</strong></p>
                <p style="margin-bottom: 1rem;">Google has restricted direct API access to Timeline data for privacy reasons. However, you can easily download your data:</p>
                <ol style="margin-left: 1.5rem; margin-bottom: 1rem;">
                    <li>Visit <a href="https://takeout.google.com/" target="_blank" style="color: #667eea;">Google Takeout</a></li>
                    <li>Select "Location History" or "Timeline"</li>
                    <li>Choose JSON format</li>
                    <li>Download and upload the file below</li>
                </ol>
                <p style="color: #10b981;">✓ Your data stays private and is processed locally in your browser</p>
            </div>
        `;

        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            max-width: 500px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 1.5rem;
            color: white;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 10000);
    }

    async searchAddress() {
        const address = this.officeAddressInput.value.trim();

        if (!address) {
            this.showAddressStatus('Please enter an address', 'error');
            return;
        }

        this.searchAddressBtn.disabled = true;
        this.searchAddressBtn.innerHTML = `
            <div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>
            Searching...
        `;

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(address)}&format=json&limit=1`,
                {
                    headers: {
                        'User-Agent': 'OfficeVisitsAnalyzer/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }

            const data = await response.json();

            if (data.length === 0) {
                this.showAddressStatus('Address not found. Please try a different address or enter coordinates manually.', 'error');
                return;
            }

            const location = data[0];
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);

            this.officeLatInput.value = lat.toFixed(6);
            this.officeLngInput.value = lng.toFixed(6);

            if (!this.officeNameInput.value && location.display_name) {
                const nameParts = location.display_name.split(',');
                this.officeNameInput.value = nameParts.slice(0, 2).join(',').trim();
            }

            this.showAddressStatus(`✓ Found: ${location.display_name}`, 'success');
            this.validateForm();

        } catch (error) {
            console.error('Geocoding error:', error);
            this.showAddressStatus('Error finding address. Please try again or enter coordinates manually.', 'error');
        } finally {
            this.searchAddressBtn.disabled = false;
            this.searchAddressBtn.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search
            `;
        }
    }

    showAddressStatus(message, type) {
        this.addressStatus.textContent = message;
        this.addressStatus.className = type;
        this.addressStatus.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                this.addressStatus.style.display = 'none';
            }, 5000);
        }
    }

    attachEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Address search
        this.searchAddressBtn.addEventListener('click', () => this.searchAddress());
        this.officeAddressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchAddress();
            }
        });

        // Form inputs
        this.officeLatInput.addEventListener('input', () => this.validateForm());
        this.officeLngInput.addEventListener('input', () => this.validateForm());
        this.radiusInput.addEventListener('input', () => this.updateRadius());
        this.monthSelect.addEventListener('change', () => this.validateForm());
        this.yearSelect.addEventListener('change', () => this.validateForm());

        // Analyze button
        this.analyzeBtn.addEventListener('click', () => this.analyzeVisits());

        // Export button
        this.exportBtn.addEventListener('click', () => this.exportResults());
    }

    populateMonthSelect() {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            this.monthSelect.appendChild(option);
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file.name.endsWith('.json')) {
            alert('Please upload a JSON file');
            return;
        }

        this.showLoading(true);

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            console.log('=== FILE LOADED ===');
            console.log('File name:', file.name);
            console.log('File size:', file.size, 'bytes');

            this.timelineData = this.parseTimelineData(data);

            if (!this.timelineData || this.timelineData.length === 0) {
                throw new Error('No timeline data found in the file');
            }

            // Save to IndexedDB for persistence
            await this.storage.saveTimelineData(data, file.name);
            console.log('✓ Data saved to IndexedDB');

            this.fileName.textContent = file.name;
            this.uploadArea.style.display = 'none';
            this.fileInfo.style.display = 'flex';

            this.populateYearSelect();
            this.validateForm();

            this.showNotification(`✓ Successfully loaded ${this.timelineData.length} location records and saved for future use!`, 'success');
        } catch (error) {
            alert('Error reading file: ' + error.message);
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    async loadStoredData() {
        try {
            const storedRecord = await this.storage.getTimelineData();

            if (storedRecord) {
                console.log('=== LOADING STORED DATA ===');
                console.log('Stored file:', storedRecord.fileName);
                console.log('Upload date:', new Date(storedRecord.uploadDate).toLocaleString());

                this.timelineData = this.parseTimelineData(storedRecord.data);

                if (this.timelineData && this.timelineData.length > 0) {
                    this.fileName.textContent = storedRecord.fileName + ' (from storage)';
                    this.uploadArea.style.display = 'none';
                    this.fileInfo.style.display = 'flex';

                    this.populateYearSelect();
                    this.validateForm();

                    console.log(`✓ Loaded ${this.timelineData.length} records from storage`);
                    this.showNotification(`✓ Loaded ${this.timelineData.length} records from previous upload`, 'success');
                }
            } else {
                console.log('No stored data found - upload your Timeline JSON to get started');
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    parseTimelineData(data) {
        let locations = [];

        console.log('=== PARSING TIMELINE DATA ===');
        console.log('Top-level keys:', Object.keys(data));

        // iPhone/Semantic Timeline format (direct array with visit objects)
        if (Array.isArray(data)) {
            console.log('✓ Format: Direct array (likely iPhone/Semantic Timeline)');
            locations = data;
        }
        // Android Timeline Objects format
        else if (data.timelineObjects) {
            console.log('✓ Format: Timeline Objects (Android Records.json)');
            data.timelineObjects.forEach(obj => {
                if (obj.placeVisit) {
                    locations.push({ ...obj.placeVisit, _format: 'placeVisit' });
                }
                if (obj.activitySegment) {
                    locations.push({ ...obj.activitySegment, _format: 'activitySegment' });
                }
            });
        }
        // Semantic Segments
        else if (data.semanticSegments) {
            console.log('✓ Format: Semantic Segments');
            data.semanticSegments.forEach(segment => {
                if (segment.visit) {
                    locations.push({ ...segment.visit, _format: 'semanticVisit' });
                }
                if (segment.activity) {
                    locations.push({ ...segment.activity, _format: 'semanticActivity' });
                }
            });
        }
        // Legacy Location History
        else if (data.locations) {
            console.log('✓ Format: Legacy Location History');
            locations = data.locations.map(loc => ({ ...loc, _format: 'legacy' }));
        }

        console.log(`Parsed ${locations.length} total records`);

        if (locations.length > 0) {
            console.log('Sample record:', JSON.stringify(locations[0], null, 2));
        }

        return locations;
    }

    populateYearSelect() {
        const years = new Set();
        let parsedCount = 0;

        console.log('=== EXTRACTING YEARS ===');

        this.timelineData.forEach((location, index) => {
            const timestamp = this.extractTimestamp(location);
            if (timestamp) {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    years.add(date.getFullYear());
                    parsedCount++;
                }
            }

            // Log first few for debugging
            if (index < 3) {
                console.log(`Record ${index}:`, {
                    timestamp: this.extractTimestamp(location),
                    coords: this.extractLatLng(location),
                    format: location._format
                });
            }
        });

        console.log(`Successfully parsed timestamps from ${parsedCount}/${this.timelineData.length} records`);
        console.log('Years found:', Array.from(years).sort());

        this.yearSelect.innerHTML = '<option value="">Select a year</option>';

        Array.from(years)
            .sort((a, b) => b - a)
            .forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                this.yearSelect.appendChild(option);
            });
    }

    extractTimestamp(location) {
        // iPhone format: startTime and endTime as ISO strings
        if (location.startTime) {
            return location.startTime;
        }
        if (location.endTime) {
            return location.endTime;
        }

        // Android formats
        const possibleFields = [
            location.timestamp,
            location.timestampMs,
            location.duration?.startTimestamp,
            location.duration?.startTimestampMs,
            location.visit?.topCandidate?.placeLocation?.timestamp,
            location.startTimestamp,
            location.startTimestampMs
        ];

        for (let field of possibleFields) {
            if (field) {
                if (typeof field === 'string') {
                    return field;
                } else if (typeof field === 'number') {
                    return new Date(field).toISOString();
                }
            }
        }

        return null;
    }

    extractLatLng(location) {
        // iPhone format: placeLocation as "geo:lat,lng" string
        if (location.visit?.topCandidate?.placeLocation) {
            const geoStr = location.visit.topCandidate.placeLocation;
            if (typeof geoStr === 'string' && geoStr.startsWith('geo:')) {
                const coords = geoStr.substring(4).split(',');
                if (coords.length >= 2) {
                    return {
                        lat: parseFloat(coords[0]),
                        lng: parseFloat(coords[1])
                    };
                }
            }
        }

        // Android E7 format: Direct coordinates
        if (location.latitudeE7 !== undefined && location.longitudeE7 !== undefined) {
            return {
                lat: location.latitudeE7 / 1e7,
                lng: location.longitudeE7 / 1e7
            };
        }

        // Android E7 format: Nested in location object
        if (location.location) {
            if (location.location.latitudeE7 !== undefined) {
                return {
                    lat: location.location.latitudeE7 / 1e7,
                    lng: location.location.longitudeE7 / 1e7
                };
            }
        }

        // Android E7 format: Activity segment start location
        if (location.startLocation) {
            if (location.startLocation.latitudeE7 !== undefined) {
                return {
                    lat: location.startLocation.latitudeE7 / 1e7,
                    lng: location.startLocation.longitudeE7 / 1e7
                };
            }
        }

        // Semantic visit format
        if (location.topCandidate?.placeLocation) {
            const loc = location.topCandidate.placeLocation;
            // Check for geo: string format
            if (typeof loc === 'string' && loc.startsWith('geo:')) {
                const coords = loc.substring(4).split(',');
                if (coords.length >= 2) {
                    return {
                        lat: parseFloat(coords[0]),
                        lng: parseFloat(coords[1])
                    };
                }
            }
            // Check for E7 format
            if (loc.latitudeE7 !== undefined) {
                return {
                    lat: loc.latitudeE7 / 1e7,
                    lng: loc.longitudeE7 / 1e7
                };
            }
        }

        return null;
    }

    async removeFile() {
        // Delete from IndexedDB
        await this.storage.deleteTimelineData();
        console.log('✓ Data removed from IndexedDB');

        this.timelineData = null;
        this.fileInput.value = '';
        this.uploadArea.style.display = 'block';
        this.fileInfo.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.yearSelect.innerHTML = '<option value="">Select a year</option>';
        this.validateForm();

        this.showNotification('✓ Data removed. Upload a new file to start fresh.', 'success');
    }

    updateRadius() {
        this.radius = parseInt(this.radiusInput.value);
        console.log('Detection radius updated to:', this.radius, 'meters');
    }

    validateForm() {
        const hasData = this.timelineData !== null;
        const hasLocation = this.officeLatInput.value && this.officeLngInput.value;
        const hasMonth = this.monthSelect.value !== '';
        const hasYear = this.yearSelect.value !== '';

        this.analyzeBtn.disabled = !(hasData && hasLocation && hasMonth && hasYear);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    analyzeVisits() {
        this.showLoading(true);

        setTimeout(() => {
            try {
                const officeLat = parseFloat(this.officeLatInput.value);
                const officeLng = parseFloat(this.officeLngInput.value);
                const month = parseInt(this.monthSelect.value);
                const year = parseInt(this.yearSelect.value);

                console.log('=== ANALYZING VISITS ===');
                console.log('Office location:', { lat: officeLat, lng: officeLng });
                console.log('Month:', month, 'Year:', year);
                console.log('Radius:', this.radius, 'meters');

                const visits = [];
                const visitDates = new Set();
                let processedCount = 0;
                let matchedCount = 0;

                this.timelineData.forEach((location, index) => {
                    const timestamp = this.extractTimestamp(location);
                    if (!timestamp) return;

                    const date = new Date(timestamp);
                    if (isNaN(date.getTime())) return;

                    processedCount++;

                    // Check month and year
                    if (date.getMonth() !== month || date.getFullYear() !== year) {
                        return;
                    }

                    const coords = this.extractLatLng(location);
                    if (!coords) return;

                    const distance = this.calculateDistance(
                        officeLat, officeLng,
                        coords.lat, coords.lng
                    );

                    if (distance <= this.radius) {
                        matchedCount++;
                        visits.push({
                            date: date,
                            timestamp: timestamp,
                            distance: distance,
                            location: location,
                            coords: coords
                        });
                        visitDates.add(date.toDateString());

                        // Log first few matches
                        if (matchedCount <= 5) {
                            console.log(`Match ${matchedCount}:`, {
                                date: date.toLocaleString(),
                                distance: Math.round(distance) + 'm',
                                coords: coords
                            });
                        }
                    }
                });

                console.log(`Processed ${processedCount} records`);
                console.log(`Found ${visits.length} visits within ${this.radius}m`);
                console.log(`Unique days: ${visitDates.size}`);

                visits.sort((a, b) => a.date - b.date);

                const visitsByDay = this.groupVisitsByDay(visits);

                this.displayResults(visitsByDay, visitDates.size);
            } catch (error) {
                alert('Error analyzing visits: ' + error.message);
                console.error(error);
            } finally {
                this.showLoading(false);
            }
        }, 100);
    }

    groupVisitsByDay(visits) {
        const grouped = {};

        visits.forEach(visit => {
            const dateKey = visit.date.toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(visit);
        });

        const result = [];
        Object.entries(grouped).forEach(([dateKey, dayVisits]) => {
            const firstVisit = dayVisits[0];
            const lastVisit = dayVisits[dayVisits.length - 1];

            // Calculate duration using actual startTime and endTime from records
            let duration = 0;

            // For iPhone format, use startTime and endTime from each visit
            dayVisits.forEach(visit => {
                const loc = visit.location;
                if (loc.startTime && loc.endTime) {
                    const start = new Date(loc.startTime);
                    const end = new Date(loc.endTime);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        duration += (end - start);
                    }
                }
            });

            // Fallback: if no startTime/endTime, use timestamp difference
            if (duration === 0 && dayVisits.length > 0) {
                duration = lastVisit.date - firstVisit.date;
            }

            result.push({
                date: firstVisit.date,
                visits: dayVisits.length,
                duration: duration,
                firstVisit: firstVisit,
                lastVisit: lastVisit
            });
        });

        return result;
    }

    displayResults(visitsByDay, uniqueDays) {
        const totalVisits = visitsByDay.reduce((sum, day) => sum + day.visits, 0);
        const totalDuration = visitsByDay.reduce((sum, day) => sum + day.duration, 0);
        const avgDuration = visitsByDay.length > 0 ? totalDuration / visitsByDay.length : 0;

        this.totalVisitsEl.textContent = totalVisits;
        this.uniqueDaysEl.textContent = uniqueDays;
        this.avgDurationEl.textContent = this.formatDuration(avgDuration);

        this.visitsListEl.innerHTML = '';
        visitsByDay.forEach((day, index) => {
            const visitItem = document.createElement('div');
            visitItem.className = 'visit-item';
            visitItem.style.setProperty('--index', index);

            const dateStr = day.date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Get start and end times from the actual visit records
            let startTimeStr = 'N/A';
            let endTimeStr = 'N/A';

            if (day.firstVisit.location.startTime) {
                const startDate = new Date(day.firstVisit.location.startTime);
                startTimeStr = startDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            if (day.lastVisit.location.endTime) {
                const endDate = new Date(day.lastVisit.location.endTime);
                endTimeStr = endDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            visitItem.innerHTML = `
                <div class="visit-date">${dateStr}</div>
                <div class="visit-time">
                    <span style="color: var(--accent-success);">In:</span> ${startTimeStr}
                </div>
                <div class="visit-time">
                    <span style="color: var(--accent-warning);">Out:</span> ${endTimeStr}
                </div>
                <div class="visit-duration">${this.formatDuration(day.duration)}</div>
            `;

            this.visitsListEl.appendChild(visitItem);
        });

        this.currentResults = visitsByDay;

        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    formatDuration(ms) {
        if (!ms || isNaN(ms)) return '0m';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    exportResults() {
        if (!this.currentResults) return;

        const monthName = this.monthSelect.options[this.monthSelect.selectedIndex].text;
        const year = this.yearSelect.value;
        const officeName = this.officeNameInput.value || 'Office';

        let csv = 'Date,Day,Start Time,End Time,Duration\n';

        this.currentResults.forEach(day => {
            const date = day.date.toLocaleDateString('en-US');
            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });

            let startTime = 'N/A';
            let endTime = 'N/A';

            if (day.firstVisit.location.startTime) {
                const startDate = new Date(day.firstVisit.location.startTime);
                startTime = startDate.toLocaleTimeString('en-US');
            }

            if (day.lastVisit.location.endTime) {
                const endDate = new Date(day.lastVisit.location.endTime);
                endTime = endDate.toLocaleTimeString('en-US');
            }

            const duration = this.formatDuration(day.duration);

            csv += `"${date}","${dayName}","${startTime}","${endTime}","${duration}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${officeName}_visits_${monthName}_${year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showNotification('✓ Results exported successfully!', 'success');
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TimelineAnalyzer();
});
