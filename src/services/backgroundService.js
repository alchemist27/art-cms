import { db, storage } from '../config/firebase.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    deleteDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'firebase/storage';

class BackgroundService {
    constructor() {
        this.collectionName = 'backgrounds';
    }

    /**
     * Upload a background image to Firebase Storage and save metadata to Firestore
     */
    async uploadBackground(file, category, displayName) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('올바른 이미지 파일을 선택해주세요.');
            }

            // Create unique ID
            const backgroundId = `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create storage path (backgrounds/category/filename)
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const storagePath = `backgrounds/${category}/${fileName}`;
            
            // Upload to Firebase Storage
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, file, {
                contentType: file.type,
                customMetadata: {
                    category: category,
                    displayName: displayName,
                    uploadedAt: new Date().toISOString()
                }
            });
            
            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Generate thumbnail URL (same as full image for now)
            const thumbnailUrl = downloadURL;
            
            // Save metadata to Firestore
            const metadata = {
                id: backgroundId,
                category: category,
                displayName: displayName,
                fileName: file.name,
                originalFileName: file.name,
                storagePath: storagePath,
                url: downloadURL,
                thumbnailUrl: thumbnailUrl,
                size: file.size,
                type: file.type,
                width: null,  // Will be populated if needed
                height: null, // Will be populated if needed
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const docRef = doc(db, this.collectionName, backgroundId);
            await setDoc(docRef, metadata);
            
            console.log('Background uploaded successfully:', backgroundId);
            return metadata;
        } catch (error) {
            console.error('Error uploading background:', error);
            throw error;
        }
    }

    /**
     * Get all backgrounds or filter by category
     */
    async getBackgrounds(category = null) {
        try {
            let q;
            if (category) {
                q = query(
                    collection(db, this.collectionName),
                    where('category', '==', category),
                    orderBy('createdAt', 'desc')
                );
            } else {
                q = query(
                    collection(db, this.collectionName),
                    orderBy('createdAt', 'desc')
                );
            }
            
            const querySnapshot = await getDocs(q);
            const backgrounds = [];
            
            querySnapshot.forEach((doc) => {
                backgrounds.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            
            return backgrounds;
        } catch (error) {
            // If orderBy fails due to index not created yet, fallback to simple query
            console.log('Falling back to simple query without ordering');
            
            let q;
            if (category) {
                q = query(
                    collection(db, this.collectionName),
                    where('category', '==', category)
                );
            } else {
                q = collection(db, this.collectionName);
            }
            
            const querySnapshot = await getDocs(q);
            const backgrounds = [];
            
            querySnapshot.forEach((doc) => {
                backgrounds.push({
                    ...doc.data(),
                    id: doc.id
                });
            });
            
            // Sort manually if orderBy failed
            backgrounds.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });
            
            return backgrounds;
        }
    }

    /**
     * Get a single background by ID
     */
    async getBackground(backgroundId) {
        try {
            const docRef = doc(db, this.collectionName, backgroundId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    ...docSnap.data(),
                    id: docSnap.id
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting background:', error);
            throw error;
        }
    }

    /**
     * Delete a background (both from Storage and Firestore)
     */
    async deleteBackground(backgroundId) {
        try {
            // Get background data first
            const background = await this.getBackground(backgroundId);
            
            if (!background) {
                throw new Error('배경 이미지를 찾을 수 없습니다.');
            }
            
            // Delete from Firebase Storage
            if (background.storagePath) {
                try {
                    const storageRef = ref(storage, background.storagePath);
                    await deleteObject(storageRef);
                    console.log('Deleted from storage:', background.storagePath);
                } catch (storageError) {
                    console.error('Error deleting from storage:', storageError);
                    // Continue even if storage deletion fails
                }
            }
            
            // Delete from Firestore
            const docRef = doc(db, this.collectionName, backgroundId);
            await deleteDoc(docRef);
            
            console.log('Background deleted successfully:', backgroundId);
            return true;
        } catch (error) {
            console.error('Error deleting background:', error);
            throw error;
        }
    }

    /**
     * Update background metadata
     */
    async updateBackground(backgroundId, updates) {
        try {
            const docRef = doc(db, this.collectionName, backgroundId);
            
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(docRef, updateData);
            
            console.log('Background updated successfully:', backgroundId);
            return true;
        } catch (error) {
            console.error('Error updating background:', error);
            throw error;
        }
    }

    /**
     * Get backgrounds by category for dropdown/selection
     */
    async getBackgroundsByCategory(category) {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('category', '==', category)
            );
            
            const querySnapshot = await getDocs(q);
            const backgrounds = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                backgrounds.push({
                    id: doc.id,
                    displayName: data.displayName,
                    url: data.url,
                    thumbnailUrl: data.thumbnailUrl
                });
            });
            
            return backgrounds;
        } catch (error) {
            console.error('Error getting backgrounds by category:', error);
            throw error;
        }
    }

    /**
     * Get all categories with background counts
     */
    async getCategoriesWithCounts() {
        try {
            const querySnapshot = await getDocs(collection(db, this.collectionName));
            const categoryCounts = {};
            
            querySnapshot.forEach((doc) => {
                const category = doc.data().category;
                if (category) {
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                }
            });
            
            return categoryCounts;
        } catch (error) {
            console.error('Error getting category counts:', error);
            throw error;
        }
    }
}

export const backgroundService = new BackgroundService();