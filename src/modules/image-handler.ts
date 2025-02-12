import Konva from 'konva';
import { BaseModule } from './base-module';
import { DEFAULT_SETTINGS } from '../constants';
import { ImageDimensions } from '../types/types';

export class ImageHandler extends BaseModule {
  public handleImageUpload(event: Event): void {
    if (this.readOnly) return;

    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !file.type.startsWith('image/')) {
      console.warn('Invalid file type');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => this.handleImageLoad(e);
    reader.readAsDataURL(file);

    // Reset input
    target.value = '';
  }

  private handleImageLoad(e: ProgressEvent<FileReader>): void {
    const result = e.target?.result;
    if (!result || typeof result !== 'string') return;

    const img = new Image();
    img.onload = () => this.createKonvaImage(img);
    img.src = result;
  }

  public createKonvaImage(img: HTMLImageElement): void {
    try {
      const dimensions = this.calculateImageDimensions(img);

      const konvaImage = new Konva.Image({
        x: (this.stage.width() - dimensions.width) / 2,
        y: (this.stage.height() - dimensions.height) / 2,
        image: img,
        width: dimensions.width,
        height: dimensions.height,
        draggable: !this.readOnly,
        name: 'object',
        id: `image-${this.blockId}-${Date.now()}`,
      });

      this.layer.add(konvaImage);
      this.setHighQualityRendering();

      this.callbacks.onSelect?.(konvaImage);
      this.safeDraw();
      this.onDirty();
    } catch (error) {
      console.error('Error creating image:', error);
    }
  }

  private calculateImageDimensions(img: HTMLImageElement): ImageDimensions {
    const maxWidth = this.stage.width() * DEFAULT_SETTINGS.IMAGE_SCALE_FACTOR;
    const maxHeight = this.stage.height() * DEFAULT_SETTINGS.IMAGE_SCALE_FACTOR;

    let { width, height } = img;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width, height };
  }

  private setHighQualityRendering(): void {
    const canvas = this.layer.getCanvas();
    const context = canvas._canvas.getContext('2d');
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
  }
}
