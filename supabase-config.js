// Supabase Configuration - All-in-one: Auth, Settings, Storage
const SUPABASE_URL = 'https://rhhelabvioumqhtzfkrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoaGVsYWJ2aW91bXFodHpma3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjM1MjksImV4cCI6MjA4MTI5OTUyOX0.My6u42QVpHc6vdfmz3fkFAxCG9RJKawKNoV5I57dXwk';

// Full Supabase Manager (replaces FirebaseManager)
class SupabaseManager {
    constructor() {
        this.supabaseUrl = SUPABASE_URL;
        this.supabaseKey = SUPABASE_ANON_KEY;
        this.bucketName = 'timeline-files';
        this.currentUser = null;
        this.authListeners = [];

        // Initialize auth state
        this.initAuth();
    }

    // ==================== AUTH METHODS ====================

    async initAuth() {
        // Check for existing session
        const session = await this.getSession();
        if (session?.user) {
            this.currentUser = session.user;
            this.notifyAuthListeners(session.user);
        }

        // Listen for auth changes (e.g., from OAuth callback)
        this.handleAuthCallback();
    }

    async getSession() {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                    'apikey': this.supabaseKey
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { user };
            }
            return null;
        } catch (error) {
            console.log('No active session');
            return null;
        }
    }

    getAccessToken() {
        // Get token from localStorage (Supabase stores it there)
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
            try {
                const parsed = JSON.parse(storedSession);
                return parsed.currentSession?.access_token || parsed.access_token || '';
            } catch {
                return '';
            }
        }
        return '';
    }

    handleAuthCallback() {
        // Check if we're returning from OAuth
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
            console.log('OAuth callback detected, storing session...');

            // Store tokens
            const session = {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: Date.now() + (3600 * 1000) // 1 hour
            };
            localStorage.setItem('supabase.auth.token', JSON.stringify({ currentSession: session }));

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Get user info
            this.fetchUser(accessToken);
        }
    }

    async fetchUser(accessToken) {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': this.supabaseKey
                }
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                console.log('✓ User authenticated:', user.email);
                this.notifyAuthListeners(user);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    async signInWithGoogle() {
        const redirectTo = window.location.origin + window.location.pathname;
        const authUrl = `${this.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
        window.location.href = authUrl;
    }

    async signOut() {
        try {
            const accessToken = this.getAccessToken();
            if (accessToken) {
                await fetch(`${this.supabaseUrl}/auth/v1/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'apikey': this.supabaseKey
                    }
                });
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }

        localStorage.removeItem('supabase.auth.token');
        this.currentUser = null;
        this.notifyAuthListeners(null);
        window.location.reload();
    }

    onAuthChange(callback) {
        this.authListeners.push(callback);
        // Immediately call with current state
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
            const response = await fetch(
                `${this.supabaseUrl}/rest/v1/user_settings?user_id=eq.${this.currentUser.id}&select=*`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.getAccessToken()}`,
                        'apikey': this.supabaseKey
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    return { defaultOffice: data[0].default_office };
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting settings:', error);
            return null;
        }
    }

    async saveSettings(settings) {
        if (!this.currentUser) throw new Error('Not authenticated');

        try {
            // Check if settings exist
            const existing = await this.getSettings();

            const payload = {
                user_id: this.currentUser.id,
                default_office: settings.defaultOffice,
                updated_at: new Date().toISOString()
            };

            let response;
            if (existing) {
                // Update existing
                response = await fetch(
                    `${this.supabaseUrl}/rest/v1/user_settings?user_id=eq.${this.currentUser.id}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${this.getAccessToken()}`,
                            'apikey': this.supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(payload)
                    }
                );
            } else {
                // Insert new
                response = await fetch(
                    `${this.supabaseUrl}/rest/v1/user_settings`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.getAccessToken()}`,
                            'apikey': this.supabaseKey,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(payload)
                    }
                );
            }

            if (!response.ok) {
                throw new Error(`Save settings failed: ${response.statusText}`);
            }

            console.log('✓ Settings saved to Supabase');
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    // ==================== STORAGE METHODS ====================

    async getStorageInfo() {
        if (!this.currentUser) return null;
        return this.getFileMetadata(this.currentUser.id);
    }

    async uploadTimelineData(file, onProgress) {
        if (!this.currentUser) throw new Error('Must be signed in to upload');

        try {
            const fileName = `${this.currentUser.id}/timeline.json`;
            const fileContent = await file.text();

            console.log('Uploading to Supabase Storage:', fileName);

            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json',
                        'x-upsert': 'true'
                    },
                    body: fileContent
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Upload failed: ${error}`);
            }

            console.log('✓ Upload complete to Supabase');

            if (onProgress) onProgress(100);

            return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${fileName}`;
        } catch (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
    }

    async downloadTimelineData() {
        if (!this.currentUser) return null;

        try {
            const fileName = `${this.currentUser.id}/timeline.json`;

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
                    console.log('No timeline file found');
                    return null;
                }
                throw new Error(`Download failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✓ Timeline data downloaded from Supabase');
            return data;
        } catch (error) {
            console.error('Download error:', error);
            return null;
        }
    }

    async getFileMetadata(userId) {
        try {
            const fileName = `${userId}/timeline.json`;

            // Use HEAD request to check if file exists
            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`,
                {
                    method: 'HEAD',
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                return null; // File doesn't exist
            }

            // Get size from Content-Length header
            const size = parseInt(response.headers.get('Content-Length') || '0');

            return {
                fileName: 'location-history.json',
                fileSize: size,
                uploadDate: new Date().toISOString(),
                sizeInMB: (size / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            // Silently return null - file check failed but that's okay
            return null;
        }
    }
}

// Export for use in main app
window.SupabaseManager = SupabaseManager;
