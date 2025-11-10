import { db, storage } from '../config/firebase.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from 'firebase/storage';

class ProductMetadataService {
    constructor() {
        this.db = db;
        this.storage = storage;
        this.collectionName = 'product_metadata';
    }

    /**
     * Save product metadata to Firestore
     */
    async saveMetadata(productNo, metadata) {
        try {
            const docRef = doc(this.db, this.collectionName, productNo.toString());
            
            const data = {
                ...metadata,
                productNo: productNo.toString(),
                updatedAt: new Date().toISOString(),
                createdAt: metadata.createdAt || new Date().toISOString()
            };

            await setDoc(docRef, data, { merge: true });
            console.log('Product metadata saved:', productNo);
            return data;
        } catch (error) {
            console.error('Error saving product metadata:', error);
            throw error;
        }
    }

    /**
     * Get product metadata from Firestore
     */
    async getMetadata(productNo) {
        try {
            const docRef = doc(this.db, this.collectionName, productNo.toString());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting product metadata:', error);
            throw error;
        }
    }

    /**
     * Get all product metadata
     */
    async getAllMetadata() {
        try {
            const querySnapshot = await getDocs(collection(this.db, this.collectionName));
            const metadata = {};
            
            querySnapshot.forEach((doc) => {
                metadata[doc.id] = doc.data();
            });
            
            return metadata;
        } catch (error) {
            console.error('Error getting all metadata:', error);
            throw error;
        }
    }

    /**
     * Upload product thumbnail to Firebase Storage
     */
    async uploadThumbnail(productNo, file) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Please upload an image.');
            }

            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `thumbnail_${productNo}_${timestamp}_${file.name}`;
            const filePath = `products/${productNo}/thumbnail/${fileName}`;

            // Create storage reference
            const storageRef = ref(this.storage, filePath);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file, {
                contentType: file.type,
                customMetadata: {
                    productNo: productNo.toString(),
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                    type: 'thumbnail'
                }
            });

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log('Thumbnail uploaded successfully:', downloadURL);
            return {
                url: downloadURL,
                path: filePath,
                fileName: fileName,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            throw error;
        }
    }

    /**
     * Upload product image to Firebase Storage
     */
    async uploadImage(productNo, file) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Please upload an image.');
            }

            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `${productNo}_${timestamp}_${file.name}`;
            const filePath = `products/${productNo}/images/${fileName}`;

            // Create storage reference
            const storageRef = ref(this.storage, filePath);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file, {
                contentType: file.type,
                customMetadata: {
                    productNo: productNo.toString(),
                    originalName: file.name,
                    uploadedAt: new Date().toISOString()
                }
            });

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log('Image uploaded successfully:', downloadURL);
            return {
                url: downloadURL,
                path: filePath,
                fileName: fileName,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Upload multiple product images to Firebase Storage
     */
    async uploadMultipleImages(productNo, files) {
        try {
            if (!files || files.length === 0) {
                return [];
            }

            const uploadPromises = Array.from(files).map(file =>
                this.uploadImage(productNo, file)
            );

            const results = await Promise.all(uploadPromises);
            console.log(`${results.length} images uploaded successfully`);
            return results;
        } catch (error) {
            console.error('Error uploading multiple images:', error);
            throw error;
        }
    }

    /**
     * Delete product image from Firebase Storage
     */
    async deleteImage(imagePath) {
        try {
            if (!imagePath) return;
            
            const storageRef = ref(this.storage, imagePath);
            await deleteObject(storageRef);
            
            console.log('Image deleted successfully:', imagePath);
        } catch (error) {
            console.error('Error deleting image:', error);
            // Don't throw error if file doesn't exist
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        }
    }

    /**
     * Update product metadata with image info
     */
    async updateProductImage(productNo, imageInfo) {
        try {
            const docRef = doc(this.db, this.collectionName, productNo.toString());
            
            // Get existing metadata to delete old image if exists
            const existingData = await this.getMetadata(productNo);
            
            if (existingData && existingData.imagePath && existingData.imagePath !== imageInfo.path) {
                // Delete old image
                await this.deleteImage(existingData.imagePath);
            }
            
            // Update metadata with new image info
            await updateDoc(docRef, {
                imageUrl: imageInfo.url,
                imagePath: imageInfo.path,
                imageFileName: imageInfo.fileName,
                imageSize: imageInfo.size,
                imageType: imageInfo.type,
                imageUpdatedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            console.log('Product image metadata updated:', productNo);
            return imageInfo;
        } catch (error) {
            console.error('Error updating product image metadata:', error);
            throw error;
        }
    }

    /**
     * Search products by metadata
     */
    async searchByMetadata(field, value) {
        try {
            const q = query(
                collection(this.db, this.collectionName),
                where(field, '==', value)
            );
            
            const querySnapshot = await getDocs(q);
            const results = [];
            
            querySnapshot.forEach((doc) => {
                results.push({
                    productNo: doc.id,
                    ...doc.data()
                });
            });
            
            return results;
        } catch (error) {
            console.error('Error searching metadata:', error);
            throw error;
        }
    }

    /**
     * Batch update multiple products
     */
    async batchUpdateMetadata(updates) {
        try {
            const promises = updates.map(({ productNo, metadata }) => 
                this.saveMetadata(productNo, metadata)
            );
            
            const results = await Promise.all(promises);
            console.log(`Batch updated ${results.length} products`);
            return results;
        } catch (error) {
            console.error('Error in batch update:', error);
            throw error;
        }
    }

    /**
     * Load existing metadata for displayed products
     */
    async loadMetadataForProducts(productNumbers) {
        try {
            const metadata = {};
            const promises = productNumbers.map(async (productNo) => {
                const data = await this.getMetadata(productNo);
                if (data) {
                    metadata[productNo] = data;
                }
            });
            
            await Promise.all(promises);
            return metadata;
        } catch (error) {
            console.error('Error loading metadata for products:', error);
            return {};
        }
    }
}

export const productMetadataService = new ProductMetadataService();