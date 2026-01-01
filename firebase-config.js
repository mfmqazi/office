// Firebase Configuration - Final Implementation
// Replace the config block below with your actual Firebase project settings

const firebaseConfig = {
    apiKey: "AIzaSyAAZOV6kbonJgco12FuHVIgLVgCRbpXFCc",
    authDomain: "mq--maps.firebaseapp.com",
    projectId: "mq--maps",
    storageBucket: "mq--maps.firebasestorage.app",
    messagingSenderId: "298019467730",
    appId: "1:298019467730:web:e2a46fea8242797fe8980b",
    measurementId: "G-023HW8LX60"
};

// Initialize Firebase (Compat mode for easier integration with existing app.js)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

class FirebaseManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        this.bucketName = 'users'; // Organized by users/{userId}/timeline.json

        // Initialize auth state
        this.initAuth();
    }

    // ==================== AUTH METHODS ====================

    initAuth() {
        auth.onAuthStateChanged(user => {
            this.currentUser = user;
            this.notifyAuthListeners(user);
        });
    }

    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            return await auth.signInWithPopup(provider);
        } catch (error) {
            console.error('Firebase Google Sign-In Error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            window.location.reload();
        } catch (error) {
            console.error('Firebase Sign-Out Error:', error);
        }
    }

    onAuthChange(callback) {
        this.authListeners.push(callback);
        if (this.currentUser) {
            callback(this.currentUser);
        }
    }

    notifyAuthListeners(user) {
        this.authListeners.forEach(callback => callback(user));
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // ==================== SETTINGS METHODS ====================

    async getSettings() {
        if (!this.currentUser) return null;

        try {
            const docRef = db.collection('users').doc(this.currentUser.uid);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data();
                return data.settings || null;
            }
            return null;
        } catch (error) {
            console.error('Error getting settings from Firestore:', error);
            return null;
        }
    }

    async saveSettings(settings) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            const docRef = db.collection('users').doc(this.currentUser.uid);
            await docRef.set({
                settings: settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('✓ Settings saved to Firestore');
        } catch (error) {
            console.error('Error saving settings to Firestore:', error);
            throw error;
        }
    }

    // ==================== STORAGE METHODS ====================

    async getStorageInfo() {
        if (!this.currentUser) return null;

        try {
            const fileName = `users/${this.currentUser.uid}/timeline.json`;
            const fileRef = storage.ref().child(fileName);
            const metadata = await fileRef.getMetadata();

            return {
                fileName: 'timeline.json',
                fileSize: metadata.size,
                uploadDate: metadata.updated,
                sizeInMB: (metadata.size / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            // File likely doesn't exist
            return null;
        }
    }

    async uploadTimelineData(file, onProgress) {
        if (!this.currentUser) throw new Error('Must be signed in to upload');

        try {
            const fileName = `users/${this.currentUser.uid}/timeline.json`;
            const fileRef = storage.ref().child(fileName);

            console.log('Uploading to Firebase Storage:', fileName);

            const uploadTask = fileRef.put(file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        console.error('Upload failed:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        console.log('✓ Upload complete to Firebase');

                        // Also update metadata in Firestore for quick access
                        await this.updateTimelineMetadata(file.size, downloadURL);

                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('Firebase upload error:', error);
            throw error;
        }
    }

    async updateTimelineMetadata(size, url) {
        if (!this.currentUser) return;
        const docRef = db.collection('users').doc(this.currentUser.uid);
        await docRef.set({
            timelineFile: {
                fileName: 'timeline.json',
                fileSize: size,
                uploadDate: new Date().toISOString(),
                downloadURL: url
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    async downloadTimelineData() {
        if (!this.currentUser) return null;

        try {
            const fileName = `users/${this.currentUser.uid}/timeline.json`;
            const fileRef = storage.ref().child(fileName);
            const url = await fileRef.getDownloadURL();

            console.log('Downloading from Firebase Storage...');
            const response = await fetch(url);

            if (!response.ok) throw new Error('Download failed');

            const data = await response.json();
            console.log('✓ Timeline data downloaded from Firebase');
            return data;
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }
}

// Export for use in main app
window.FirebaseManager = FirebaseManager;
