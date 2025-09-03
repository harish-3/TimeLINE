/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const VIDEO_WIDTH = 720;
const VIDEO_HEIGHT = 960; // 3:4 aspect ratio to match polaroids
const DURATION_PER_IMAGE_MS = 3000; // 3 seconds per image
const TRANSITION_DURATION_MS = 500; // 0.5 second cross-fade

// Helper to load an image
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image for video: ${err}`));
        img.src = src;
    });
}

/**
 * Creates a video from a series of images using the Canvas and MediaRecorder APIs.
 * @param images A record mapping decade to an object with a URL.
 * @param onProgress A callback to report progress messages.
 * @returns A promise that resolves to a video Blob.
 */
export async function createVideoFromImages(
    images: Record<string, { url?: string }>,
    onProgress: (message: string) => void
): Promise<Blob> {
    onProgress("Initializing video renderer...");
    const canvas = document.createElement('canvas');
    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error("Could not create canvas context");

    const stream = canvas.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
            if (chunks.length === 0) {
                reject(new Error("Video recording resulted in an empty file."));
                return;
            }
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            resolve(videoBlob);
        };
        recorder.onerror = (e) => {
            reject(new Error(`MediaRecorder error: ${e}`));
        };
    });

    recorder.start();

    const sortedImages = Object.entries(images)
        .filter(([, data]) => data.url)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([decade, data]) => ({ decade, url: data.url! }));

    onProgress("Loading images...");
    const loadedImages = await Promise.all(
        sortedImages.map(imgData => loadImage(imgData.url))
    );

    function drawFrame(
        img: HTMLImageElement,
        decade: string,
        progress: number, // 0 to 1 for the Ken Burns effect
        opacity: number = 1
    ) {
        if (!ctx) return;
        
        ctx.save();
        ctx.globalAlpha = opacity;

        // "Ken Burns" effect: slow zoom in
        const scale = 1 + progress * 0.1;
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const canvasAspect = VIDEO_WIDTH / VIDEO_HEIGHT;
        const imgAspect = imgWidth / imgHeight;

        let drawWidth, drawHeight;

        // Fit image to canvas while covering it (crop to fit)
        if (canvasAspect > imgAspect) {
            drawWidth = VIDEO_WIDTH * scale;
            drawHeight = (VIDEO_WIDTH / imgAspect) * scale;
        } else {
            drawHeight = VIDEO_HEIGHT * scale;
            drawWidth = (VIDEO_HEIGHT * imgAspect) * scale;
        }
        
        const x = (VIDEO_WIDTH - drawWidth) / 2;
        const y = (VIDEO_HEIGHT - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        const decadeNum = parseInt(decade.substring(0, 4));

        // --- Apply effects over the image ---
        // Vignette for 2010s (Instagram feel)
        if (decadeNum === 2010) {
            const gradient = ctx.createRadialGradient(VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, VIDEO_HEIGHT / 3, VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2, VIDEO_HEIGHT);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        }

        // Neon color overlay for 2040s (Cyberpunk)
        if (decadeNum === 2040) {
            ctx.globalCompositeOperation = 'color';
            ctx.fillStyle = 'rgba(255, 0, 255, 0.2)'; // Magenta tint
            ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Scanlines for 2050s (Hologram)
        if (decadeNum === 2050) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < VIDEO_HEIGHT; i += 4) {
                ctx.fillRect(0, i, VIDEO_WIDTH, 1);
            }
        }

        // --- Draw decade text ---
        ctx.font = `80px 'Permanent Marker', cursive`;
        ctx.textAlign = 'center';

        if (decadeNum >= 2040) { // Neon Text for 2040s/2050s
            const neonColor = decadeNum === 2040 ? '#f0f' : '#0ff';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = neonColor;
            ctx.shadowBlur = 20;
            ctx.fillText(decade, VIDEO_WIDTH / 2, VIDEO_HEIGHT - 80);
            // Add inner glow
            ctx.shadowBlur = 10;
            ctx.fillText(decade, VIDEO_WIDTH / 2, VIDEO_HEIGHT - 80);
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 15;
            ctx.fillText(decade, VIDEO_WIDTH / 2, VIDEO_HEIGHT - 80);
        }
        
        ctx.restore(); // Restore context to pre-save state (alpha, shadows, etc.)
    }

    let frameRequestId: number;
    let currentImageIndex = 0;
    let timeOnCurrentImage = 0;
    let lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
        if (!ctx) return;

        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        timeOnCurrentImage += deltaTime;

        // Clear canvas with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        
        // Move to the next image if the duration has passed
        if (timeOnCurrentImage >= DURATION_PER_IMAGE_MS) {
            currentImageIndex++;
            timeOnCurrentImage = timeOnCurrentImage % DURATION_PER_IMAGE_MS; // Carry over remainder
            
            // If we've processed all images, stop the animation.
            if (currentImageIndex >= sortedImages.length) {
                onProgress("Finalizing video...");
                cancelAnimationFrame(frameRequestId);
                if (recorder.state === 'recording') {
                    recorder.stop();
                }
                return;
            }
        }

        // At this point, currentImageIndex is guaranteed to be valid.
        const currentImg = loadedImages[currentImageIndex];
        const currentDecadeInfo = sortedImages[currentImageIndex];
        onProgress(`Rendering ${currentDecadeInfo.decade}...`);

        // Draw current image
        const progress = timeOnCurrentImage / DURATION_PER_IMAGE_MS;
        drawFrame(currentImg, currentDecadeInfo.decade, progress);

        // Handle the cross-fade transition to the next image
        const nextImageIndex = currentImageIndex + 1;
        if (nextImageIndex < sortedImages.length && timeOnCurrentImage > DURATION_PER_IMAGE_MS - TRANSITION_DURATION_MS) {
            const transitionProgress = (timeOnCurrentImage - (DURATION_PER_IMAGE_MS - TRANSITION_DURATION_MS)) / TRANSITION_DURATION_MS;
            const nextImg = loadedImages[nextImageIndex];
            const nextDecadeInfo = sortedImages[nextImageIndex];
            // Draw next image with increasing opacity
            drawFrame(nextImg, nextDecadeInfo.decade, 0, transitionProgress);
        }
    
        frameRequestId = requestAnimationFrame(animate);
    };

    frameRequestId = requestAnimationFrame(animate);

    return recordingPromise;
}