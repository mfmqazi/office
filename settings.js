// Settings Manager for Office Visits Analyzer
class SettingsManager {
    constructor() {
        this.storageKey = 'officeVisitsSettings';
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
            console.log('✓ Settings saved:', settings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    getSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const settings = JSON.parse(saved);
                console.log('✓ Settings loaded:', settings);
                return settings;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return null;
    }

    clearSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('✓ Settings cleared');
            return true;
        } catch (error) {
            console.error('Error clearing settings:', error);
            return false;
        }
    }

    getDefaultOffice() {
        const settings = this.getSettings();
        return settings?.defaultOffice || null;
    }

    saveDefaultOffice(officeData) {
        const settings = this.getSettings() || {};
        settings.defaultOffice = {
            name: officeData.name,
            address: officeData.address,
            lat: officeData.lat,
            lng: officeData.lng,
            radius: officeData.radius || 100,
            savedAt: new Date().toISOString()
        };
        return this.saveSettings(settings);
    }
}

// Export for use in main app
window.SettingsManager = SettingsManager;
