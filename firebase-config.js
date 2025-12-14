// Firebase Configuration and Initialization
const firebaseConfig = {
    apiKey: "AIzaSyAAZOV6kbonJgco12FuHVIgLVgCRbpXFCc",
    authDomain: "mq--maps.firebaseapp.com",
    projectId: "mq--maps",
    storageBucket: "mq--maps.firebasestorage.app",
    messagingSenderId: "298019467730",
    appId: "1:298019467730:web:e2a46fea8242797fe8980b",
    measurementId: "G-023HW8LX60"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Firebase Manager Class
class FirebaseManager {
    constructor() {
        this.currentUser = null;
        this.onAuthStateChanged = null;
    }

    // Authentication Methods
    async signInWithGoogle() {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            this.currentUser = result.user;
            console.log('✓ Signed in:', this.currentUser.email);
            return this.currentUser;
        } catch (error) {
            console.error('Sign-in error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await auth.signOut();
            this.currentUser = null;
            console.log('✓ Signed out');
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    }

    onAuthChange(callback) {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            callback(user);
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Storage Methods - Upload Timeline JSON
    async uploadTimelineData(file, onProgress) {
        if (!this.currentUser) {
            throw new Error('Must be signed in to upload');
        }

        const userId = this.currentUser.uid;
        const storageRef = storage.ref(`users/${userId}/timeline.json`);

        return new Promise((resolve, reject) => {
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                    console.log(`Upload progress: ${progress.toFixed(1)}%`);
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                    // Save metadata to Firestore
                    await this.saveTimelineMetadata({
                        fileName: file.name,
                        fileSize: file.size,
                        uploadDate: new Date().toISOString(),
                        downloadURL: downloadURL
                    });

                    console.log('✓ Upload complete');
                    resolve(downloadURL);
                }
            );
        });
    }

    // Download Timeline JSON
    async downloadTimelineData() {
        if (!this.currentUser) {
            throw new Error('Must be signed in to download');
        }

        const userId = this.currentUser.uid;
        const storageRef = storage.ref(`users/${userId}/timeline.json`);

        try {
            const downloadURL = await storageRef.getDownloadURL();
            const response = await fetch(downloadURL);
            const data = await response.json();
            console.log('✓ Timeline data downloaded');
            return data;
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                console.log('No timeline data found');
                return null;
            }
            throw error;
        }
    }

    // Delete Timeline JSON
    async deleteTimelineData() {
        if (!this.currentUser) {
            throw new Error('Must be signed in to delete');
        }

        const userId = this.currentUser.uid;
        const storageRef = storage.ref(`users/${userId}/timeline.json`);

        try {
            await storageRef.delete();
            await this.deleteTimelineMetadata();
            console.log('✓ Timeline data deleted');
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                console.log('No timeline data to delete');
            } else {
                throw error;
            }
        }
    }

    // Firestore Methods - Settings & Metadata
    async saveSettings(settings) {
        if (!this.currentUser) {
            throw new Error('Must be signed in to save settings');
        }

        const userId = this.currentUser.uid;
        await db.collection('users').doc(userId).set({
            settings: settings,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✓ Settings saved to Firestore');
    }

    async getSettings() {
        if (!this.currentUser) {
            throw new Error('Must be signed in to get settings');
        }

        const userId = this.currentUser.uid;
        const doc = await db.collection('users').doc(userId).get();

        if (doc.exists) {
            return doc.data().settings || null;
        }
        return null;
    }

    async saveTimelineMetadata(metadata) {
        if (!this.currentUser) {
            throw new Error('Must be signed in');
        }

        const userId = this.currentUser.uid;
        await db.collection('users').doc(userId).set({
            timelineFile: metadata,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✓ Timeline metadata saved');
    }

    async getTimelineMetadata() {
        if (!this.currentUser) {
            throw new Error('Must be signed in');
        }

        const userId = this.currentUser.uid;
        const doc = await db.collection('users').doc(userId).get();

        if (doc.exists) {
            return doc.data().timelineFile || null;
        }
        return null;
    }

    async deleteTimelineMetadata() {
        if (!this.currentUser) {
            throw new Error('Must be signed in');
        }

        const userId = this.currentUser.uid;
        await db.collection('users').doc(userId).update({
            timelineFile: firebase.firestore.FieldValue.delete()
        });

        console.log('✓ Timeline metadata deleted');
    }

    // Get storage usage info
    async getStorageInfo() {
        if (!this.currentUser) {
            return null;
        }

        const metadata = await this.getTimelineMetadata();
        if (metadata) {
            return {
                fileName: metadata.fileName,
                fileSize: metadata.fileSize,
                uploadDate: metadata.uploadDate,
                sizeInMB: (metadata.fileSize / (1024 * 1024)).toFixed(2)
            };
        }
        return null;
    }
}

// Export for use in main app
window.FirebaseManager = FirebaseManager;
