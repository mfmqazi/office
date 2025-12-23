// Google Maps Timeline Analyzer - Supabase Edition - Updated: 2024-12-14T16:21
class TimelineAnalyzer {
    constructor() {
        this.timelineData = null;
        this.officeLocation = null;
        this.radius = 100;
        this.selectedMonth = null;
        this.selectedYear = null;
        this.isAuthenticated = false;
        this.storage = new TimelineStorage();
        this.settings = new SettingsManager();
        this.supabase = new SupabaseManager();
        this.autocompleteTimeout = null;
        this.selectedAutocompleteIndex = -1;

        this.initializeElements();
        this.attachEventListeners();
        this.initGoogleAuth();
        this.initSupabaseAuth();
        this.loadStoredData();
        this.loadDefaultOffice();
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
        this.autocompleteDropdown = document.getElementById('autocomplete-dropdown');
        this.addressStatus = document.getElementById('address-status');
        this.officeNameInput = document.getElementById('office-name');
        this.officeLatInput = document.getElementById('office-lat');
        this.officeLngInput = document.getElementById('office-lng');
        this.radiusInput = document.getElementById('radius');
        this.saveDefaultBtn = document.getElementById('save-default-btn');

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
        const googleSignInBtn = document.getElementById('google-signin-btn');

        try {
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = `
                <div class="spinner" style="width: 24px; height: 24px; border-width: 3px;"></div>
                Signing in...
            `;

            console.log('Attempting Supabase sign-in...');
            await this.supabase.signInWithGoogle();
            // Redirect will happen, user will return authenticated

            // Success - button will be updated by auth state listener

        } catch (error) {
            console.error('Sign-in error:', error);

            // Reset button
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = `
                <svg class="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
            `;

            // Show user-friendly error message
            this.showNotification(`Sign-in failed: ${error.message}`, 'error');
        }
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

    initSupabaseAuth() {
        // Listen for auth state changes
        this.supabase.onAuthChange(async (user) => {
            if (user) {
                console.log('=== SUPABASE USER SIGNED IN ===');
                console.log('Email:', user.email);
                console.log('UID:', user.id);

                this.updateSignInUI(user);
                this.showNotification(`✓ Signed in as ${user.email}`, 'success');

                // Try to load data from Supabase Storage
                await this.loadDataFromSupabase();

                // Try to load settings from Supabase
                await this.loadSettingsFromSupabase();

            } else {
                console.log('User signed out or not authenticated');
            }
        });
    }

    updateSignInUI(user) {
        // Hide Google Sign-In button and show user info
        const googleSignInContainer = document.querySelector('.google-signin-container');
        if (googleSignInContainer) {
            googleSignInContainer.innerHTML = `
                <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; text-align: center;">
                    <p style="color: var(--accent-success); margin-bottom: 0.5rem;">✓ Signed in as <strong>${user.email}</strong></p>
                    <button class="btn-secondary" id="sign-out-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
                        Sign Out
                    </button>
                </div>
                <div class="divider">
                    <span>UPLOAD YOUR DATA</span>
                </div>
            `;

            // Add sign-out handler
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) {
                signOutBtn.addEventListener('click', async () => {
                    await this.supabase.signOut();
                });
            }
        }
    }

    async loadDataFromSupabase() {
        try {
            const storageInfo = await this.supabase.getStorageInfo();

            if (storageInfo) {
                console.log('=== LOADING FROM SUPABASE STORAGE ===');
                console.log('File:', storageInfo.fileName);
                console.log('Size:', storageInfo.sizeInMB, 'MB');
                console.log('Uploaded:', new Date(storageInfo.uploadDate).toLocaleString());

                this.showNotification('Loading your timeline data from cloud...', 'info');

                const data = await this.supabase.downloadTimelineData();

                if (data) {
                    this.timelineData = this.parseTimelineData(data);

                    if (this.timelineData && this.timelineData.length > 0) {
                        this.fileName.textContent = storageInfo.fileName + ' (from cloud)';
                        this.uploadArea.style.display = 'none';
                        this.fileInfo.style.display = 'flex';

                        this.populateYearSelect();
                        this.validateForm();

                        this.showNotification(`✓ Loaded ${this.timelineData.length} records from cloud`, 'success');
                        this.autoAnalyzeIfReady();
                    }
                }
            } else {
                console.log('No cloud data found');
            }
        } catch (error) {
            console.error('Error loading from Supabase:', error);
        }
    }

    async loadSettingsFromSupabase() {
        try {
            const settings = await this.supabase.getSettings();

            if (settings && settings.defaultOffice) {
                console.log('=== LOADING SETTINGS FROM SUPABASE ===');
                const office = settings.defaultOffice;

                this.officeNameInput.value = office.name;
                this.officeAddressInput.value = office.address;
                this.officeLatInput.value = office.lat;
                this.officeLngInput.value = office.lng;
                this.radiusInput.value = office.radius || 100;
                this.radius = office.radius || 100;

                this.saveDefaultBtn.style.display = 'inline-flex';
                this.validateForm();

                this.showNotification(`✓ Loaded office settings: ${office.name}`, 'success');
                this.autoAnalyzeIfReady();
            }
        } catch (error) {
            console.error('Error loading settings from Supabase:', error);
        }
    }

    // Address Autocomplete Methods
    handleAddressInput(e) {
        const query = e.target.value.trim();

        if (query.length < 3) {
            this.hideAutocomplete();
            return;
        }

        // Debounce the search
        clearTimeout(this.autocompleteTimeout);
        this.autocompleteTimeout = setTimeout(() => {
            this.searchAddressSuggestions(query);
        }, 300);
    }

    async searchAddressSuggestions(query) {
        try {
            this.showAutocompleteLoading();

            // Add US bias and bounded search for better local results
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}` +
                `&format=json` +
                `&limit=10` +  // Get more results to filter
                `&addressdetails=1` +
                `&countrycodes=us` +  // Prioritize US addresses
                `&bounded=1` +  // Prefer results within viewbox
                `&viewbox=-125,49,-66,24`,  // US bounding box (west,north,east,south)
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

            // Filter and rank results
            const filteredResults = this.filterAndRankResults(data, query);
            this.displayAutocompleteSuggestions(filteredResults);

        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideAutocomplete();
        }
    }

    filterAndRankResults(results, query) {
        if (!results || results.length === 0) return [];

        // Filter out less relevant results
        const filtered = results.filter(result => {
            // Must have address details
            if (!result.address) return false;

            // Prefer results with street addresses
            const hasStreet = result.address.road || result.address.street;
            const hasCity = result.address.city || result.address.town || result.address.village;
            const hasState = result.address.state;

            return hasStreet && hasCity && hasState;
        });

        // Rank results by relevance
        const ranked = filtered.map(result => {
            let score = 0;
            const queryLower = query.toLowerCase();
            const displayLower = result.display_name.toLowerCase();

            // Boost if query matches start of address
            if (displayLower.startsWith(queryLower)) score += 10;

            // Boost if has building/house number
            if (result.address.house_number) score += 5;

            // Boost commercial/office locations
            if (result.type === 'commercial' || result.type === 'office') score += 3;

            // Penalize very generic results
            if (result.type === 'administrative') score -= 5;

            return { ...result, _score: score };
        });

        // Sort by score and return top 5
        return ranked
            .sort((a, b) => b._score - a._score)
            .slice(0, 5);
    }

    showAutocompleteLoading() {
        this.autocompleteDropdown.innerHTML = '<div class="autocomplete-loading">Searching...</div>';
        this.autocompleteDropdown.style.display = 'block';
    }

    displayAutocompleteSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }

        this.autocompleteDropdown.innerHTML = '';
        this.selectedAutocompleteIndex = -1;

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.index = index;

            const mainText = suggestion.display_name.split(',').slice(0, 2).join(',');
            const secondaryText = suggestion.display_name.split(',').slice(2).join(',');

            item.innerHTML = `
                <div class="autocomplete-main">${mainText}</div>
                <div class="autocomplete-secondary">${secondaryText}</div>
            `;

            item.addEventListener('click', () => this.selectAddress(suggestion));
            this.autocompleteDropdown.appendChild(item);
        });

        this.autocompleteDropdown.style.display = 'block';
    }

    handleAddressKeydown(e) {
        const items = this.autocompleteDropdown.querySelectorAll('.autocomplete-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedAutocompleteIndex = Math.min(this.selectedAutocompleteIndex + 1, items.length - 1);
            this.updateAutocompleteSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedAutocompleteIndex = Math.max(this.selectedAutocompleteIndex - 1, 0);
            this.updateAutocompleteSelection(items);
        } else if (e.key === 'Enter' && this.selectedAutocompleteIndex >= 0) {
            e.preventDefault();
            items[this.selectedAutocompleteIndex].click();
        } else if (e.key === 'Escape') {
            this.hideAutocomplete();
        }
    }

    updateAutocompleteSelection(items) {
        items.forEach((item, index) => {
            if (index === this.selectedAutocompleteIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectAddress(suggestion) {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);

        this.officeLatInput.value = lat.toFixed(6);
        this.officeLngInput.value = lng.toFixed(6);
        this.officeAddressInput.value = suggestion.display_name;

        if (!this.officeNameInput.value) {
            const nameParts = suggestion.display_name.split(',');
            this.officeNameInput.value = nameParts.slice(0, 2).join(',').trim();
        }

        this.hideAutocomplete();
        this.showAddressStatus(`✓ Selected: ${suggestion.display_name}`, 'success');
        this.saveDefaultBtn.style.display = 'inline-flex';
        this.validateForm();
    }

    hideAutocomplete() {
        this.autocompleteDropdown.style.display = 'none';
        this.autocompleteDropdown.innerHTML = '';
        this.selectedAutocompleteIndex = -1;
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

    // Settings Methods
    async saveDefaultOffice() {
        const officeData = {
            name: this.officeNameInput.value || 'My Office',
            address: this.officeAddressInput.value,
            lat: parseFloat(this.officeLatInput.value),
            lng: parseFloat(this.officeLngInput.value),
            radius: parseInt(this.radiusInput.value)
        };

        if (!officeData.lat || !officeData.lng) {
            this.showNotification('Please select a valid address first', 'error');
            return;
        }

        // Save to localStorage
        if (this.settings.saveDefaultOffice(officeData)) {
            this.showNotification('✓ Default office saved locally!', 'success');
        } else {
            this.showNotification('Error saving default office', 'error');
            return;
        }

        // If user is signed in, also save to Supabase
        if (this.supabase.getCurrentUser()) {
            try {
                await this.supabase.saveSettings({ defaultOffice: officeData });
                this.showNotification('✓ Office settings synced to cloud!', 'success');
            } catch (error) {
                console.error('Error saving to Supabase:', error);
                this.showNotification('⚠️ Saved locally, but cloud sync failed.', 'warning');
            }
        }
    }

    loadDefaultOffice() {
        const defaultOffice = this.settings.getDefaultOffice();

        if (defaultOffice) {
            console.log('=== LOADING DEFAULT OFFICE ===');
            console.log('Office:', defaultOffice.name);
            console.log('Address:', defaultOffice.address);

            this.officeNameInput.value = defaultOffice.name;
            this.officeAddressInput.value = defaultOffice.address;
            this.officeLatInput.value = defaultOffice.lat;
            this.officeLngInput.value = defaultOffice.lng;
            this.radiusInput.value = defaultOffice.radius || 100;
            this.radius = defaultOffice.radius || 100;

            this.saveDefaultBtn.style.display = 'inline-flex';
            this.validateForm();

            this.showNotification(`✓ Loaded default office: ${defaultOffice.name}`, 'success');

            // Auto-analyze if we have data
            this.autoAnalyzeIfReady();
        }
    }

    autoAnalyzeIfReady() {
        // Check if we have all required data
        if (this.timelineData &&
            this.officeLatInput.value &&
            this.officeLngInput.value) {

            // Set to current month if not set
            if (!this.monthSelect.value) {
                const now = new Date();
                this.monthSelect.value = now.getMonth();
            }

            console.log('✓ Auto-analyzing with saved settings...');
            // Small delay to let UI update
            setTimeout(() => {
                if (this.analyzeBtn && !this.analyzeBtn.disabled) {
                    this.analyzeVisits();
                }
            }, 500);
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

        // Address autocomplete
        this.officeAddressInput.addEventListener('input', (e) => this.handleAddressInput(e));
        this.officeAddressInput.addEventListener('keydown', (e) => this.handleAddressKeydown(e));
        this.officeAddressInput.addEventListener('blur', () => {
            // Delay to allow click on dropdown item
            setTimeout(() => this.hideAutocomplete(), 200);
        });

        // Save default office button
        this.saveDefaultBtn.addEventListener('click', () => this.saveDefaultOffice());

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

        // Add "Full Year" option first
        const fullYearOption = document.createElement('option');
        fullYearOption.value = 'all';
        fullYearOption.textContent = '📊 Full Year Summary';
        this.monthSelect.appendChild(fullYearOption);

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

            let finalData = this.parseTimelineData(data);

            if (!finalData || finalData.length === 0) {
                throw new Error('No timeline data found in the file');
            }

            // Sync with Supabase if signed in
            if (this.supabase.getCurrentUser()) {
                console.log('✓ User signed in - checking for existing cloud data...');
                this.showNotification('Syncing with cloud storage...', 'info');

                try {
                    // Download existing data to merge
                    const existingData = await this.supabase.downloadTimelineData();

                    if (existingData) {
                        const existingParsed = this.parseTimelineData(existingData);
                        finalData = this.mergeAndDeduplicate(existingParsed, finalData);
                        this.showNotification(`✓ Merged with cloud data! Total records: ${finalData.length}`, 'success');
                    }

                    // Upload merged data as a new Blob
                    console.log('Uploading merged data...');
                    const mergedBlob = new Blob([JSON.stringify(finalData)], { type: 'application/json' });

                    await this.supabase.uploadTimelineData(mergedBlob, (progress) => {
                        console.log(`Upload progress: ${progress.toFixed(1)}%`);
                    });

                    this.showNotification('✓ Cloud storage updated with new records!', 'success');

                } catch (syncError) {
                    console.error('Supabase sync error:', syncError);
                    this.showNotification('⚠️ Cloud sync failed. Using local file only.', 'warning');
                }
            }

            this.timelineData = finalData;

            // Save to IndexedDB (always save the FULL merged dataset)
            // storage.saveTimelineData expects 'data' object or array. finalData is array.
            await this.storage.saveTimelineData(this.timelineData, file.name);
            console.log('✓ Data saved to IndexedDB');

            this.fileName.textContent = file.name + (this.supabase.getCurrentUser() ? ' (+ Cloud Merged)' : '');
            this.uploadArea.style.display = 'none';
            this.fileInfo.style.display = 'flex';

            this.populateYearSelect();
            this.validateForm();

            this.showNotification(`✓ Successfully loaded ${this.timelineData.length} location records!`, 'success');
        } catch (error) {
            alert('Error reading file: ' + error.message);
            console.error(error);
        } finally {
            this.showLoading(false);
        }
    }

    mergeAndDeduplicate(existing, newItems) {
        console.log('=== MERGING DATASETS ===');
        console.log(`Existing records: ${existing.length}`);
        console.log(`New records: ${newItems.length}`);

        const seen = new Set();
        const merged = [];

        // Strategy: Add NEW items first (updates overwrite old)
        // Then add EXISTING items only if their timestamp wasn't seen in new items

        const addToMerged = (item) => {
            const timestamp = this.extractTimestamp(item);
            if (!timestamp) return;

            // Use timestamp as unique key
            if (!seen.has(timestamp)) {
                seen.add(timestamp);
                merged.push(item);
            }
        };

        // 1. Process new items first (priority)
        newItems.forEach(addToMerged);

        // 2. Process existing items (backfill)
        existing.forEach(addToMerged);

        console.log(`Merged total: ${merged.length} (duplicates removed: ${existing.length + newItems.length - merged.length})`);

        // Sort by time to keep it clean
        return merged.sort((a, b) => {
            const tA = new Date(this.extractTimestamp(a)).getTime();
            const tB = new Date(this.extractTimestamp(b)).getTime();
            return tA - tB;
        });
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
                const monthValue = this.monthSelect.value;
                const isFullYear = monthValue === 'all';
                const month = isFullYear ? null : parseInt(monthValue);
                const year = parseInt(this.yearSelect.value);

                console.log('=== ANALYZING VISITS ===');
                console.log('Office location:', { lat: officeLat, lng: officeLng });
                console.log('Month:', isFullYear ? 'Full Year' : month, 'Year:', year);
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

                    // Check year (and month if not full year)
                    if (date.getFullYear() !== year) return;
                    if (!isFullYear && date.getMonth() !== month) return;

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
                        if (matchedCount <= 10) {
                            console.log(`Match ${matchedCount}:`, {
                                date: date.toLocaleString(),
                                distance: Math.round(distance) + 'm',
                                coords: coords
                            });
                        }
                    }

                    // Debug: Log all Dec 5 records regardless of distance
                    if (date.getDate() === 5 && date.getMonth() === 11) { // Dec 5
                        console.log(`Dec 5 record:`, {
                            date: date.toLocaleString(),
                            distance: Math.round(distance) + 'm',
                            withinRadius: distance <= this.radius,
                            coords: coords
                        });
                    }
                });

                console.log(`Processed ${processedCount} records`);
                console.log(`Found ${visits.length} visits within ${this.radius}m`);
                console.log(`Unique days: ${visitDates.size}`);

                visits.sort((a, b) => a.date - b.date);

                const processedVisits = this.processVisits(visits);

                this.displayResults(processedVisits, visitDates.size, isFullYear);
            } catch (error) {
                alert('Error analyzing visits: ' + error.message);
                console.error(error);
            } finally {
                this.showLoading(false);
            }
        }, 100);
    }

    // Process visits - each input visit becomes a separate output entry
    processVisits(rawVisits) {
        console.log('=== PROCESS VISITS CALLED ===');
        console.log('Input visits count:', rawVisits.length);

        if (rawVisits.length === 0) return [];

        // Simply map each visit to the output format - NO CLUSTERING
        const results = rawVisits.map((visit, index) => {
            const loc = visit.location;

            // Calculate duration from startTime/endTime if available
            let duration = 0;
            if (loc.startTime && loc.endTime) {
                const start = new Date(loc.startTime);
                const end = new Date(loc.endTime);
                duration = end - start;
            }

            // If no duration calculated, default to 30 minutes
            if (duration <= 0) duration = 30 * 60 * 1000;

            if (index < 5) {
                console.log(`Output visit ${index}:`, {
                    date: visit.date.toLocaleString(),
                    duration: Math.round(duration / 60000) + ' mins',
                    hasStartEnd: !!(loc.startTime && loc.endTime)
                });
            }

            return {
                date: visit.date,
                visits: 1,
                duration: duration,
                firstVisit: visit,
                lastVisit: visit
            };
        });

        console.log('Output visits count:', results.length);
        return results;
    }

    createVisitFromCluster(cluster) {
        const first = cluster[0];
        const last = cluster[cluster.length - 1];

        let duration = last.date.getTime() - first.date.getTime();
        if (duration === 0) duration = 5 * 60 * 1000;

        return {
            date: first.date,
            visits: 1,
            duration: duration,
            firstVisit: first,
            lastVisit: last
        };
    }

    displayResults(visits, uniqueDays, isFullYear = false) {
        const totalVisits = visits.length;
        const totalDuration = visits.reduce((sum, v) => sum + v.duration, 0);
        const avgDuration = totalVisits > 0 ? totalDuration / totalVisits : 0;

        this.totalVisitsEl.textContent = totalVisits;
        this.uniqueDaysEl.textContent = uniqueDays;
        this.avgDurationEl.textContent = this.formatDuration(avgDuration);

        if (isFullYear) {
            this.renderYearlySummary(visits);
        } else {
            this.renderVisitsList(visits);
        }

        this.currentResults = visits;
    }

    renderYearlySummary(visits) {
        console.log('=== RENDERING YEARLY SUMMARY ===');
        console.log('Total visits to summarize:', visits.length);

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Group visits by month
        const monthlyData = {};
        visits.forEach(visit => {
            // Ensure date is a Date object
            const date = visit.date instanceof Date ? visit.date : new Date(visit.date);
            const month = date.getMonth();

            if (!monthlyData[month]) {
                monthlyData[month] = { visits: 0, duration: 0, days: new Set() };
            }
            monthlyData[month].visits++;
            monthlyData[month].duration += visit.duration;
            monthlyData[month].days.add(date.toDateString());
        });

        // Create summary HTML
        let html = `
            <div class="yearly-summary">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">📊 Monthly Breakdown</h3>
                <table class="monthly-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Visits</th>
                            <th>Days</th>
                            <th>Total Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let grandTotalVisits = 0;
        let grandTotalDays = 0;
        let grandTotalDuration = 0;

        let height = 0;
        let hasData = false;

        // Loop 0-11
        monthNames.forEach((name, index) => {
            const data = monthlyData[index];
            if (data) {
                hasData = true;
                grandTotalVisits += data.visits;
                grandTotalDays += data.days.size;
                grandTotalDuration += data.duration;
                html += `
                    <tr>
                        <td style="color: white; font-weight: bold;">${name}</td>
                        <td style="color: white;">${data.visits}</td>
                        <td style="color: white;">${data.days.size}</td>
                        <td style="color: white;">${this.formatDuration(data.duration)}</td>
                    </tr>
                `;
            }
        });

        if (!hasData) {
            html += `<tr><td colspan="4" style="text-align: center; padding: 2rem;">No visits summary data available</td></tr>`;
        }

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background: rgba(99, 102, 241, 0.2);">
                            <td style="color: white;">TOTAL</td>
                            <td style="color: white;">${grandTotalVisits}</td>
                            <td style="color: white;">${grandTotalDays}</td>
                            <td style="color: white;">${this.formatDuration(grandTotalDuration)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        console.log('Generated Summary HTML length:', html.length);

        // Ensure section is visible - CRITICAL!
        if (this.resultsSection) {
            this.resultsSection.hidden = false;
            this.resultsSection.style.display = 'block';
        }

        this.visitsListEl.innerHTML = html;
        this.visitsListEl.style.display = 'block'; // Force block display
        this.visitsListEl.style.visibility = 'visible'; // Force visibility
        this.visitsListEl.style.opacity = '1'; // Force opacity

        console.log('=== DISPLAY DEBUG ===');
        console.log('Updated visitsListEl with summary');
        console.log('visitsListEl exists:', !!this.visitsListEl);
        console.log('visitsListEl innerHTML length:', this.visitsListEl.innerHTML.length);
        console.log('resultsSection hidden:', this.resultsSection?.hidden);
        console.log('visitsListEl display:', this.visitsListEl.style.display);

        // Log the actual HTML for inspection
        console.log('Generated HTML preview (first 500 chars):', html.substring(0, 500));

        // Try alternative method: create element and append
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        console.log('Temp div children count:', tempDiv.children.length);

        console.log('=== END DEBUG ===');

        // Scroll results into view, matching renderVisitsList behavior
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderVisitsList(visits) {
        this.visitsListEl.innerHTML = '';

        if (visits.length === 0) {
            this.visitsListEl.innerHTML = '<div class="no-results">No visits found matching your criteria</div>';
            return;
        }

        visits.forEach((visit, index) => {
            const item = document.createElement('div');
            item.className = 'visit-item';
            item.style.setProperty('--index', index);

            const dateStr = visit.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            let startTime = visit.firstVisit.date;
            let endTime;

            // If semantic, try to get actual end time
            if (visit.lastVisit.location.endTime) {
                endTime = new Date(visit.lastVisit.location.endTime);
            } else {
                endTime = new Date(startTime.getTime() + visit.duration);
            }

            const durationStr = this.formatDuration(visit.duration);

            item.innerHTML = `
                <div class="visit-date">${dateStr}</div>
                <div class="visit-time">
                    <span style="color: var(--accent-success);">In:</span> ${this.formatTime(startTime)}
                </div>
                <div class="visit-time">
                    <span style="color: var(--accent-warning);">Out:</span> ${this.formatTime(endTime)}
                </div>
                <div class="visit-duration">${durationStr}</div>
            `;

            this.visitsListEl.appendChild(item);
        });
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

    formatTime(date) {
        if (!date || !(date instanceof Date)) return 'N/A';
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
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
