// Supabase Configuration and Storage Manager
const SUPABASE_URL = 'https://rhhelabvioumqhtzfkrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoaGVsYWJ2aW91bXFodHpma3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjM1MjksImV4cCI6MjA4MTI5OTUyOX0.My6u42QVpHc6vdfmz3fkFAxCG9RJKawKNoV5I57dXwk';

// Supabase Storage Manager for Timeline Files
class SupabaseStorageManager {
    constructor() {
        this.supabaseUrl = SUPABASE_URL;
        this.supabaseKey = SUPABASE_ANON_KEY;
        this.bucketName = 'timeline-files';
    }

    // Upload Timeline JSON to Supabase Storage
    async uploadTimelineFile(file, userId, onProgress) {
        try {
            const fileName = `${userId}/timeline.json`;

            console.log('Uploading to Supabase Storage:', fileName);

            // Read file as text
            const fileContent = await file.text();

            // Upload to Supabase Storage
            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json',
                        'x-upsert': 'true' // Overwrite if exists
                    },
                    body: fileContent
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Upload failed: ${error}`);
            }

            const result = await response.json();
            console.log('✓ Upload successful:', result);

            // Get public URL
            const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${fileName}`;

            if (onProgress) onProgress(100);

            return {
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                downloadURL: publicUrl,
                path: fileName
            };

        } catch (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
    }

    // Download Timeline JSON from Supabase Storage
    async downloadTimelineFile(userId) {
        try {
            const fileName = `${userId}/timeline.json`;

            console.log('Downloading from Supabase Storage:', fileName);

            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('No timeline file found in Supabase');
                    return null;
                }
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✓ Download successful');

            return data;

        } catch (error) {
            console.error('Supabase download error:', error);
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    // Delete Timeline JSON from Supabase Storage
    async deleteTimelineFile(userId) {
        try {
            const fileName = `${userId}/timeline.json`;

            console.log('Deleting from Supabase Storage:', fileName);

            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );

            if (!response.ok && response.status !== 404) {
                throw new Error(`Delete failed: ${response.statusText}`);
            }

            console.log('✓ Delete successful');

        } catch (error) {
            console.error('Supabase delete error:', error);
            if (!error.message.includes('404')) {
                throw error;
            }
        }
    }

    // Get file metadata
    async getFileMetadata(userId) {
        try {
            const fileName = `${userId}/timeline.json`;

            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/info/${this.bucketName}/${fileName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`Metadata fetch failed: ${response.statusText}`);
            }

            const metadata = await response.json();

            return {
                fileName: 'timeline.json',
                fileSize: metadata.metadata?.size || 0,
                uploadDate: metadata.created_at,
                sizeInMB: ((metadata.metadata?.size || 0) / (1024 * 1024)).toFixed(2)
            };

        } catch (error) {
            console.error('Metadata fetch error:', error);
            return null;
        }
    }
}

// Export for use in main app
window.SupabaseStorageManager = SupabaseStorageManager;
