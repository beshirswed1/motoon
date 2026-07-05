export interface UploadProvider {
  upload(file: File, opts?: Record<string, unknown>): Promise<{ url: string }>;
}

class ImgBBProvider implements UploadProvider {
  async upload(file: File): Promise<{ url: string }> {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      throw new Error('ImgBB API key is missing. Please set NEXT_PUBLIC_IMGBB_API_KEY in your environment.');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Failed to upload image to ImgBB');
    }

    const data = await response.json();
    return { url: data.data.url };
  }
}

class FirebaseUploadProvider implements UploadProvider {
  async upload(file: File): Promise<{ url: string }> {
    // Provider Pattern Placeholder for Future Swapping
    console.warn('Uploading via Firebase Storage provider...', file.name);
    // Return a dummy object URL or throw error if not fully configured.
    // For testing/future implementation, we simulate uploading.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ url: URL.createObjectURL(file) });
      }, 1000);
    });
  }
}

export function getUploadProvider(type: 'imgbb' | 'firebase'): UploadProvider {
  if (type === 'imgbb') {
    return new ImgBBProvider();
  }
  if (type === 'firebase') {
    return new FirebaseUploadProvider();
  }
  throw new Error(`Unsupported upload provider type: ${type}`);
}
