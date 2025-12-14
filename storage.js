// IndexedDB Storage Manager for Timeline Data
class TimelineStorage {
    constructor() {
        this.dbName = 'OfficeVisitsDB';
        this.dbVersion = 1;
        this.storeName = 'timelineData';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✓ IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    console.log('✓ Object store created');
                }
            };
        });
    }

    async saveTimelineData(data, fileName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            const record = {
                id: 'current', // Always overwrite with latest data
                data: data,
                fileName: fileName,
                uploadDate: new Date().toISOString(),
                recordCount: Array.isArray(data) ? data.length :
                    data.timelineObjects ? data.timelineObjects.length :
                        data.semanticSegments ? data.semanticSegments.length :
                            data.locations ? data.locations.length : 0
            };

            const request = objectStore.put(record);

            request.onsuccess = () => {
                console.log('✓ Timeline data saved to IndexedDB');
                resolve(record);
            };

            request.onerror = () => {
                console.error('Error saving data:', request.error);
                reject(request.error);
            };
        });
    }

    async getTimelineData() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get('current');

            request.onsuccess = () => {
                if (request.result) {
                    console.log('✓ Timeline data loaded from IndexedDB');
                    resolve(request.result);
                } else {
                    console.log('No stored data found');
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Error loading data:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteTimelineData() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete('current');

            request.onsuccess = () => {
                console.log('✓ Timeline data deleted from IndexedDB');
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting data:', request.error);
                reject(request.error);
            };
        });
    }

    async getStorageInfo() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get('current');

            request.onsuccess = () => {
                if (request.result) {
                    const sizeInBytes = new Blob([JSON.stringify(request.result.data)]).size;
                    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

                    resolve({
                        exists: true,
                        fileName: request.result.fileName,
                        uploadDate: new Date(request.result.uploadDate),
                        recordCount: request.result.recordCount,
                        sizeInMB: sizeInMB
                    });
                } else {
                    resolve({ exists: false });
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}

// Export for use in main app
window.TimelineStorage = TimelineStorage;
